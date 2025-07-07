import os
import openai
import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from models import Expense, Category
from extensions import db
from dotenv import load_dotenv
from flask_login import current_user
import logging
from sqlalchemy.exc import SQLAlchemyError

# Load environment variables
load_dotenv(dotenv_path="key.env")
openai.api_key = os.getenv("OPENAI_API_KEY")

# Configure a cost-effective OpenAI model
OPENAI_MODEL = "gpt-3.5-turbo"  # Much cheaper than GPT-4
MAX_TOKENS = 150  # Limit the response length to save costs
TEMPERATURE = 0.7  # Lower temperature for more deterministic outputs

# Set up logging
logging.basicConfig(filename='app.log', level=logging.INFO, format='%(asctime)s - %(message)s')

def get_ai_response(prompt, max_tokens=MAX_TOKENS):
    """
    Get a response from OpenAI's API using the most cost-effective model.
    This function is designed to minimize token usage and costs.
    """
    try:
        # Check if API key is available
        if not openai.api_key:
            logging.error("OpenAI API key not found")
            return "I'm unable to provide AI assistance at the moment."
        
        # Make API call with cost-saving parameters
        response = openai.ChatCompletion.create(
            model=OPENAI_MODEL,
            messages=[
                {"role": "system", "content": "You are a helpful financial assistant that gives brief, concise advice."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=max_tokens,
            temperature=TEMPERATURE,
            presence_penalty=0,
            frequency_penalty=0
        )
        
        # Extract the response text
        return response.choices[0].message.content.strip()
    
    except Exception as e:
        logging.error(f"Error calling OpenAI API: {str(e)}")
        return "I encountered an error while processing your request."

def get_personalized_budget_advice(user_id, category=None):
    """Get personalized budget advice based on spending patterns"""
    try:
        from app import db  # Import here to avoid circular imports
        
        # Get all expenses for the user
        expenses_query = Expense.query.filter_by(user_id=user_id)
        
        # Filter by category if specified
        if category:
            category_obj = Category.query.filter(
                (Category.name.ilike(f"%{category}%")) & 
                ((Category.user_id == user_id) | (Category.user_id == None))
            ).first()
            
            if category_obj:
                expenses_query = expenses_query.filter_by(category_id=category_obj.id)
        
        # Get the expenses
        expenses = expenses_query.all()
        
        if not expenses:
            if category:
                return f"You don't have any expenses in the {category} category yet. Once you add some, I can provide personalized advice."
            else:
                return "You don't have any expenses yet. Once you add some, I can provide personalized advice."
        
        # Format expense data
        expense_data = []
        for expense in expenses:
            category_name = expense.expense_category.name if expense.expense_category else "Uncategorized"
            expense_data.append({
                "amount": expense.amount,
                "category": category_name,
                "date": expense.date.strftime("%Y-%m-%d"),
                "notes": expense.notes if expense.notes else "No notes"
            })
        
        # Create a summary of spending habits
        df = pd.DataFrame(expense_data)
        df['amount'] = pd.to_numeric(df['amount'])
        df['date'] = pd.to_datetime(df['date'])
        
        total_spent = df['amount'].sum()
        avg_per_expense = df['amount'].mean()
        category_totals = df.groupby('category')['amount'].sum().to_dict()
        
        # Sort categories by amount spent
        sorted_categories = sorted(category_totals.items(), key=lambda x: x[1], reverse=True)
        top_categories = sorted_categories[:3]
        
        # Format the data for the API call
        user_data = {
            "total_spent": float(total_spent),
            "avg_per_expense": float(avg_per_expense),
            "top_categories": [{"category": cat, "amount": float(amt)} for cat, amt in top_categories],
            "num_expenses": len(expenses),
            "time_period": f"{df['date'].min().strftime('%Y-%m-%d')} to {df['date'].max().strftime('%Y-%m-%d')}"
        }
        
        # Add category-specific data if requested
        if category and category_obj:
            category_expenses = [e for e in expense_data if e['category'].lower() == category.lower()]
            if category_expenses:
                category_df = pd.DataFrame(category_expenses)
                category_df['amount'] = pd.to_numeric(category_df['amount'])
                category_df['date'] = pd.to_datetime(category_df['date'])
                
                user_data["category_specific"] = {
                    "category": category,
                    "total_spent": float(category_df['amount'].sum()),
                    "avg_per_expense": float(category_df['amount'].mean()),
                    "num_expenses": len(category_expenses),
                    "percentage_of_total": float(category_df['amount'].sum() / total_spent * 100)
                }
        
        # Generate prompt
        prompt = f"Based on the following spending data for a user, provide personalized budget advice"
        if category:
            prompt += f" specifically for their {category} expenses"
        prompt += f":\n\n{user_data}\n\nProvide 3-5 specific, actionable tips to help the user manage their expenses better."
        
        # Call OpenAI API
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor providing personalized budget advice based on spending patterns."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=300,
            temperature=0.7
        )
        
        advice = response.choices[0].message.content.strip()
        return advice
        
    except Exception as e:
        print(f"Error in get_personalized_budget_advice: {str(e)}")
        return "I'm unable to provide personalized advice at the moment. Please try again later."

def get_category_suggestion(user_input):
    """
    Function to get category suggestion based on user input
    (does not use AI to save costs).
    """
    default_categories = ['Food', 'Transport', 'Entertainment', 'Bills', 'Others']
    for category in default_categories:
        if category.lower() in user_input.lower():
            return category
    return 'Others'  # Default category

def add_expense(user_id, amount, category_name, date, notes):
    """
    Function to add an expense for the user.
    """
    category = Category.query.filter_by(name=category_name, user_id=user_id).first()
    
    if not category:
        category = Category(name=category_name, user_id=user_id)
        db.session.add(category)
        db.session.commit()
    
    new_expense = Expense(amount=amount, category_id=category.id, date=date, notes=notes, user_id=user_id)
    db.session.add(new_expense)
    try:
        db.session.commit()
    except SQLAlchemyError as e:
        db.session.rollback()
        logging.error(f"Error adding expense: {e}")
        return "Error adding expense."

    return "Expense added successfully!"

def delete_expense(expense_id, user_id):
    """
    Function to delete an expense for the user.
    """
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if expense:
        db.session.delete(expense)
        db.session.commit()
        return "Expense deleted successfully!"
    return "Expense not found!"

def edit_expense(expense_id, user_id, new_amount=None, new_category=None, new_date=None, new_notes=None):
    """
    Function to edit an expense.
    """
    expense = Expense.query.filter_by(id=expense_id, user_id=user_id).first()
    if expense:
        if new_amount:
            expense.amount = new_amount
        if new_category:
            category = Category.query.filter_by(name=new_category, user_id=user_id).first()
            if not category:
                category = Category(name=new_category, user_id=user_id)
                db.session.add(category)
                db.session.commit()
            expense.category_id = category.id
        if new_date:
            expense.date = new_date
        if new_notes:
            expense.notes = new_notes
        db.session.commit()
        return "Expense updated successfully!"
    return "Expense not found!"

def predict_future_expenses(user_id, months=3):
    """Predict future expenses for the next specified number of months"""
    try:
        from app import db  # Import here to avoid circular imports
        
        # Get all expenses for the user
        expenses = Expense.query.filter_by(user_id=user_id).all()
        
        if not expenses or len(expenses) < 5:
            return {
                "success": False,
                "message": "Not enough expense data to make accurate predictions. Please add more expenses first."
            }
        
        # Format expense data
        expense_data = []
        for expense in expenses:
            category_name = expense.expense_category.name if expense.expense_category else "Uncategorized"
            expense_data.append({
                "amount": expense.amount,
                "category": category_name,
                "date": expense.date
            })
        
        # Convert to DataFrame for analysis
        df = pd.DataFrame(expense_data)
        df['amount'] = pd.to_numeric(df['amount'])
        
        # Group by month and category
        df['month_year'] = df['date'].apply(lambda x: x.strftime('%Y-%m'))
        monthly_category_totals = df.groupby(['month_year', 'category'])['amount'].sum().reset_index()
        
        # Get unique categories
        categories = df['category'].unique()
        
        # Get the last few months of data to establish trends
        unique_months = sorted(df['month_year'].unique())
        if len(unique_months) >= 3:
            recent_months = unique_months[-3:]
        else:
            recent_months = unique_months
            
        # Filter for recent data
        recent_data = monthly_category_totals[monthly_category_totals['month_year'].isin(recent_months)]
        
        # Calculate predictions by category
        predictions = {}
        overall_monthly_trend = {}
        
        # Get the current month as the starting point
        current_date = datetime.now()
        
        # For each future month, make a prediction
        for i in range(1, months+1):
            future_date = current_date + timedelta(days=30*i)
            future_month_year = future_date.strftime('%Y-%m')
            
            month_prediction = {}
            
            for category in categories:
                # Get recent spending for this category
                category_data = recent_data[recent_data['category'] == category]
                
                if len(category_data) > 0:
                    # Calculate average and trend
                    avg_spend = category_data['amount'].mean()
                    
                    # If we have multiple months, calculate trend
                    if len(category_data) > 1:
                        # Simple linear trend (more sophisticated methods could be used)
                        if len(category_data) >= 3:
                            # Fix: Properly calculate weighted average with numpy
                            weights = np.array([0.2, 0.3, 0.5])  # More weight to recent months
                            amounts = category_data['amount'].values[-3:]
                            # Ensure the arrays have the same length
                            if len(amounts) == len(weights):
                                weighted_avg = np.sum(amounts * weights)
                                predicted_amount = weighted_avg
                            else:
                                # Fallback if arrays have different lengths
                                predicted_amount = avg_spend * 1.05
                        else:
                            # Just small increase based on available data
                            predicted_amount = avg_spend * 1.05
                    else:
                        # Just use the average if only one month of data
                        predicted_amount = avg_spend
                    
                    # Add some randomness to make it more realistic
                    variation = np.random.uniform(0.9, 1.1)
                    predicted_amount = predicted_amount * variation
                    
                    # Store prediction
                    month_prediction[category] = round(predicted_amount, 2)
                else:
                    # No data for this category, use overall average if available
                    if category in overall_monthly_trend:
                        month_prediction[category] = overall_monthly_trend[category]
                    else:
                        month_prediction[category] = 0
            
            # Store the month's predictions
            predictions[future_month_year] = month_prediction
        
        # Calculate total predicted spending per month
        monthly_totals = {}
        for month, cats in predictions.items():
            monthly_totals[month] = sum(cats.values())
        
        # Format the result
        result = {
            "success": True,
            "message": f"Expense predictions for the next {months} months",
            "predictions": {
                "by_month": {month: {"total": round(total, 2), "categories": cats} 
                           for month, total, cats in zip(predictions.keys(), monthly_totals.values(), predictions.values())},
                "total_predicted": round(sum(monthly_totals.values()), 2)
            }
        }
        
        return result
        
    except Exception as e:
        print(f"Error in predict_future_expenses: {str(e)}")
        return {
            "success": False,
            "message": f"An error occurred while generating predictions: {str(e)}"
        }
