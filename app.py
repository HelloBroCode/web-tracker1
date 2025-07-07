from flask import Flask, render_template, request, redirect, url_for, flash, send_file, jsonify, session
from flask_login import login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
import pandas as pd
import io
import os
import openai
import random
from dotenv import load_dotenv
from datetime import datetime, timedelta
import plotly.express as px
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from reportlab.platypus import Table, TableStyle
from reportlab.lib import colors
from extensions import db, login_manager
from models import User, Category, Expense
from forms import LoginForm, RegisterForm, ExpenseForm, ExpenseFilterForm, SearchForm
import uuid
from werkzeug.utils import secure_filename

# Load environment variables
load_dotenv(dotenv_path="key.env")
openai.api_key = os.getenv("OPENAI_API_KEY")
if openai.api_key:
    print("OpenAI API key loaded successfully")
else:
    print("Warning: OPENAI_API_KEY not found in environment variables")

# Define allowed file extensions and upload folder
UPLOAD_FOLDER = 'static/uploads/receipts'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'pdf'}

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'ZmNkZTQzY2YzMTg0YjEwYjA3Zjk1YjY0MzZlYjFlNmU=')

# Database configuration - Use PostgreSQL in production and SQLite in development
if os.getenv('RENDER'):
    # For Render, use PostgreSQL
    db_url = os.getenv('DATABASE_URL', '')
    if db_url:
        # Replace postgres:// with postgresql:// (SQLAlchemy compatibility)
        db_url = db_url.replace('postgres://', 'postgresql://')
        app.config['SQLALCHEMY_DATABASE_URI'] = db_url
        print("Using PostgreSQL database for production")
    else:
        # Fallback to SQLite if no DATABASE_URL is provided
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
        print("Warning: DATABASE_URL not found. Using SQLite database as fallback.")
else:
    # Use SQLite for local development
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///site.db'
    print("Using SQLite database for development")

app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SESSION_TYPE'] = 'filesystem'
app.config['PERMANENT_SESSION_LIFETIME'] = 1800  # 30 minutes
app.config['SESSION_PERMANENT'] = True
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max upload

db.init_app(app)
login_manager.init_app(app)

# Create upload directory if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

def initialize_database():
    """Initialize database with retry logic for production"""
    max_retries = 5
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            with app.app_context():
                db.create_all()
                
                # Check if global categories already exist
                if Category.query.filter_by(user_id=None).count() == 0:
                    # Create default global categories
                    default_categories = [
                        "Food",
                        "Transport",
                        "Entertainment",
                        "Bills",
                        "Shopping",
                        "Health",
                        "Education",
                        "Travel",
                        "Housing",
                        "Others"
                    ]
                    
                    for category_name in default_categories:
                        category = Category(name=category_name, user_id=None)
                        db.session.add(category)
                    
                    db.session.commit()
                    print(f"Added {len(default_categories)} default categories")
                
                print("Database tables created successfully")
                return True
                
        except Exception as e:
            print(f"Database initialization attempt {attempt + 1} failed: {str(e)}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay} seconds...")
                import time
                time.sleep(retry_delay)
                retry_delay *= 2  # Exponential backoff
            else:
                print("Failed to initialize database after all retries")
                return False
    
    return False

# Initialize database with retry logic
if not initialize_database():
    print("Warning: Database initialization failed. The application may not work properly.")

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


# Helper function to check if a file has allowed extension
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/')
def home():
    return redirect(url_for('dashboard'))


@app.route('/dashboard')
@login_required
def dashboard():
    form = ExpenseForm()
    user_categories = Category.query.filter_by(user_id=current_user.id).all()
    global_categories = Category.query.filter_by(user_id=None).all()
    
    all_categories = []
    for cat in user_categories:
        all_categories.append((str(cat.id), cat.name))
    for cat in global_categories:
        all_categories.append((str(cat.id), cat.name))
    
    form.category.choices = all_categories
    
    today = datetime.now().date()
    today_expenses = Expense.query.filter_by(user_id=current_user.id).filter(Expense.date == today).all()
    today_total = sum(expense.amount for expense in today_expenses)
    
    month_start = datetime(today.year, today.month, 1).date()
    month_end = (datetime(today.year, today.month+1, 1) - timedelta(days=1)).date() if today.month < 12 else datetime(today.year, 12, 31).date()
    month_expenses = Expense.query.filter_by(user_id=current_user.id).filter(Expense.date.between(month_start, month_end)).all()
    month_total = sum(expense.amount for expense in month_expenses)
    
    today_total = f"₹{today_total:,.2f}"
    month_total = f"₹{month_total:,.2f}"
    
    expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.date.desc()).limit(5).all()
    return render_template('dashboard.html', form=form, expenses=expenses, today_total=today_total, month_total=month_total)


@app.route('/add_expense', methods=['POST'])
@login_required
def add_expense():
    form = ExpenseForm()
    user_categories = Category.query.filter_by(user_id=current_user.id).all()
    global_categories = Category.query.filter_by(user_id=None).all()
    
    all_categories = []
    for cat in user_categories:
        all_categories.append((str(cat.id), cat.name))
    for cat in global_categories:
        all_categories.append((str(cat.id), cat.name))
    
    form.category.choices = all_categories
    
    if form.validate_on_submit():
        category_id = form.category.data
        category = Category.query.get(int(category_id))
        
        expense_date = form.date.data
        current_time = datetime.now().time()
        
        amount = form.amount.data
        category_name = category.name
        auto_notes = generate_expense_notes(category_name, amount, expense_date)

        receipt_path = None
        
        if form.receipt.data:
            file = form.receipt.data
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                file_ext = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
                
                user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
                os.makedirs(user_upload_dir, exist_ok=True)
                
                file_path = os.path.join(user_upload_dir, unique_filename)
                file.save(file_path)
                
                receipt_path = os.path.join('uploads/receipts', str(current_user.id), unique_filename)

        expense = Expense(
            amount=amount,
            date=expense_date,
            time=current_time,
            notes=auto_notes,
            category_id=category.id,
            user_id=current_user.id,
            receipt_path=receipt_path
        )

        db.session.add(expense)
        db.session.commit()

        flash('Expense added successfully!', 'success')
        return redirect(url_for('dashboard'))

    expenses = Expense.query.filter_by(user_id=current_user.id).all()
    return render_template('dashboard.html', form=form, expenses=expenses)

# Helper function to generate notes automatically
def generate_expense_notes(category, amount, date):
    weekday = date.strftime("%A")
    month = date.strftime("%B")
    
    notes_templates = {
        "Food": [
            f"{weekday} meal expense",
            f"Food purchase on {weekday}",
            f"Groceries/meal for {month}",
            "Daily food expense"
        ],
        "Transport": [
            f"Transportation on {weekday}",
            "Travel expense",
            f"Commute expense for {month}",
            "Fuel/transportation cost"
        ],
        "Entertainment": [
            f"Entertainment expense on {weekday}",
            "Leisure activity",
            f"Entertainment cost for {month}",
            "Recreation expense"
        ],
        "Bills": [
            f"Bill payment for {month}",
            "Utility expense",
            "Monthly bill payment",
            "Recurring expense"
        ],
        "Others": [
            f"Miscellaneous expense on {weekday}",
            f"General expense for {month}",
            "Unspecified purchase",
            "Additional expense"
        ]
    }
    
    templates = notes_templates.get(category, notes_templates["Others"])
    
    index = min(int(amount / 100) % len(templates), len(templates) - 1)
    return templates[index]


@app.route('/view_expenses', methods=['GET'])
@login_required
def view_expenses():
    form = ExpenseFilterForm(request.args, meta={'csrf': False})
    
    user_categories = Category.query.filter_by(user_id=current_user.id).all()
    global_categories = Category.query.filter_by(user_id=None).all()
    
    all_categories = [(0, 'All')]
    for cat in user_categories:
        all_categories.append((cat.id, cat.name))
    for cat in global_categories:
        all_categories.append((cat.id, cat.name))
    
    form.category.choices = all_categories

    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_id = int(request.args.get('category', 0))

    query = Expense.query.filter_by(user_id=current_user.id)

    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%d-%m-%Y')
            end = datetime.strptime(end_date, '%d-%m-%Y')
            query = query.filter(Expense.date.between(start, end))
        except ValueError:
            flash('Invalid date range.', 'danger')
            return redirect(url_for('view_expenses'))

    if category_id > 0:
        query = query.filter_by(category_id=category_id)

    expenses = query.order_by(Expense.date.desc()).all()

    if not expenses:
        flash('No expenses found for the selected filters.', 'info')

    data = []
    for expense in expenses:
        category_name = expense.expense_category.name if expense.expense_category else 'Uncategorized'
        data.append({
            'Amount': expense.amount,
            'Category': category_name,
            'Date': expense.date
        })

    df_expenses = pd.DataFrame(data)

    if df_expenses.empty:
        flash('No data entered for this category.', 'info')
        return render_template(
            'view_expenses.html',
            expenses=expenses,
            form=form,
            start_date=start_date,
            end_date=end_date,
            categories=form.category.choices,
            selected_category=category_id,
            pie_chart_html=None,
            bar_chart_html=None
        )

    df_expenses['Date'] = pd.to_datetime(df_expenses['Date'], errors='coerce')
    df_expenses = df_expenses.dropna(subset=['Date'])

    pie_chart = px.pie(df_expenses, names='Category', values='Amount', title="Expenses by Category")
    bar_chart = px.bar(df_expenses, x='Date', y='Amount', title="", color='Category')

    bar_chart_html = bar_chart.to_html(full_html=False)

    return render_template(
        'view_expenses.html',
        expenses=expenses,
        form=form,
        start_date=start_date,
        end_date=end_date,
        categories=form.category.choices,
        selected_category=category_id,
        pie_chart_html=pie_chart.to_html(full_html=False),
        bar_chart_html=bar_chart_html
    )


@app.route('/delete_expense/<int:expense_id>', methods=['POST'])
@login_required
def delete_expense(expense_id):
    expense = Expense.query.get_or_404(expense_id)
    if expense.user_id != current_user.id:
        flash('Unauthorized action.', 'danger')
        return redirect(url_for('view_expenses'))
    db.session.delete(expense)
    db.session.commit()
    flash('Expense deleted successfully.', 'success')
    return redirect(url_for('view_expenses'))


@app.route('/export_csv')
@login_required
def export_csv():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    query = Expense.query.filter_by(user_id=current_user.id)
    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%d-%m-%Y')
            end = datetime.strptime(end_date, '%d-%m-%Y')
            query = query.filter(Expense.date.between(start, end))
        except ValueError:
            flash('Invalid date range.', 'danger')
            return redirect(url_for('view_expenses'))

    expenses = query.all()
    data = [({
        'Amount': e.amount,
        'Date': e.date.strftime('%d-%m-%Y'),
        'Category': e.expense_category.name,
        'Notes': e.notes or '',
        'Time': e.time.strftime('%H:%M:%S')
    }) for e in expenses]

    df = pd.DataFrame(data)
    output = io.StringIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return send_file(io.BytesIO(output.read().encode()), mimetype='text/csv',
                     as_attachment=True, download_name='expenses.csv')


@app.route('/export_pdf')
@login_required
def export_pdf():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    category_id = request.args.get('category')

    query = Expense.query.filter_by(user_id=current_user.id)

    if start_date and end_date:
        try:
            start = datetime.strptime(start_date, '%d-%m-%Y')
            end = datetime.strptime(end_date, '%d-%m-%Y')
            query = query.filter(Expense.date.between(start, end))
        except ValueError:
            flash('Invalid date range.', 'danger')
            return redirect(url_for('view_expenses'))

    expenses = query.all()

    buffer = io.BytesIO()
    c = canvas.Canvas(buffer, pagesize=letter)
    c.drawString(100, 750, "Expense Report")
    
    data = []
    for expense in expenses:
        category_name = expense.expense_category.name if expense.expense_category else 'Uncategorized'
        data.append([ 
            expense.date.strftime('%d-%m-%Y'),
            category_name,
            f"{expense.amount:.2f}",
            expense.notes
        ])

    table = Table([['Date', 'Category', 'Amount', 'Notes']] + data)
    table.setStyle(TableStyle([ 
        ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
        ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.black),
    ]))

    table.wrapOn(c, 30, 600)
    table.drawOn(c, 30, 500)

    c.save()
    buffer.seek(0)
    return send_file(buffer, as_attachment=True, download_name='expense_report.pdf', mimetype='application/pdf')


@app.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    form = LoginForm()
    if form.validate_on_submit():
        user = User.query.filter_by(username=form.username.data).first()
        if user and check_password_hash(user.password, form.password.data):
            login_user(user, remember=form.remember.data)
            flash('Login successful!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Login Unsuccessful. Check username and/or password', 'danger')
    
    return render_template('login.html', form=form)


@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out!', 'info')
    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard'))

    form = RegisterForm()
    if form.validate_on_submit():
        hashed_password = generate_password_hash(form.password.data, method='pbkdf2:sha256')
        user = User(username=form.username.data, email=form.email.data, password=hashed_password)
        db.session.add(user)
        db.session.commit()
        flash('Your account has been created! You can now log in.', 'success')
        return redirect(url_for('login'))

    return render_template('register.html', form=form)

@app.route("/finmate", methods=["POST"])
@login_required
def finmate():
    user_input = request.json.get("input")
    
    # Simple approach: Store each piece directly in the session
    if 'conversation_state' not in session:
        session['conversation_state'] = "initial"
    
    conversation_state = session['conversation_state']
    print(f"Current state: {conversation_state}, Input: {user_input}")
    print(f"Session data: amount={session.get('amount')}, category={session.get('category')}, date={session.get('date')}")

    # First, try to detect direct expense statements like "I spent ₹500 on food"
    # or "₹200 for transport" before going into the conversation flow
    import re
    
    # Patterns for expense detection
    amount_pattern = r'₹?\s*(\d+(?:\.\d+)?)'  # Matches ₹500, 500, 500.50
    category_words = ['food', 'groceries', 'transport', 'transportation', 'travel', 'bills', 'entertainment', 'health', 'shopping', 'others']
    
    # Multiple patterns to capture different ways of expressing expenses
    spent_pattern = re.compile(fr'(?:spent|paid|bought|cost|costs|purchased|{amount_pattern}).*?{amount_pattern}.*?(?:on|for)?\s*(' + '|'.join(category_words) + ')', re.IGNORECASE)
    category_first_pattern = re.compile(fr'(' + '|'.join(category_words) + r').*?(?:cost|costs|came to|for|is|was)?\s*{amount_pattern}', re.IGNORECASE)
    
    # Check if the user input matches direct expense patterns
    spent_match = spent_pattern.search(user_input)
    category_first_match = category_first_pattern.search(user_input)
    only_amount_match = re.match(f'^{amount_pattern}$', user_input)
    
    if spent_match:
        # Extract amount and category from "spent X on Y" pattern
        amount = float(spent_match.group(2) or spent_match.group(1))
        category = spent_match.group(3).capitalize()
        
        # Map similar categories
        if category.lower() in ['groceries', 'grocery']:
            category = 'Food'
        elif category.lower() in ['transportation', 'travel']:
            category = 'Transport'
            
        # Set values in session
        session['amount'] = amount
        session['category'] = category
        session['date'] = datetime.now().strftime("%d-%m-%Y")  # Default to today
        
        # Jump directly to processing the expense
        try:
            # Auto-generate notes
            date = datetime.now().date()
            auto_notes = generate_expense_notes(category, amount, date)
            
            # Find or create category
            category_obj = Category.query.filter_by(name=category, user_id=current_user.id).first()
            if not category_obj:
                # Try global category
                category_obj = Category.query.filter_by(name=category, user_id=None).first()
                
                if not category_obj:
                    # Create new category
                    category_obj = Category(name=category, user_id=current_user.id)
                    db.session.add(category_obj)
                    db.session.commit()  # Commit to ensure category has an ID
            
            # Create expense
            expense = Expense(
                amount=amount,
                date=date,
                time=datetime.now().time(),
                notes=auto_notes,
                category_id=category_obj.id,
                user_id=current_user.id
            )
            db.session.add(expense)
            db.session.commit()
            
            # Reset the session
            session.pop('conversation_state', None)
            session.pop('amount', None)
            session.pop('category', None)
            session.pop('date', None)
            
            return jsonify({
                "response": f"Expense added successfully! Amount: ₹{amount}, Category: {category}, Date: {date.strftime('%d-%m-%Y')}, Notes: {auto_notes}"
            })
            
        except Exception as e:
            print(f"Error adding expense: {str(e)}")
            # Reset the session
            session.pop('conversation_state', None)
            session.pop('amount', None)
            session.pop('category', None)
            session.pop('date', None)
            return jsonify({"response": f"An error occurred: {str(e)}. Let's start over. Please enter the amount."})
    
    elif category_first_match:
        # Extract from "Category cost X" pattern
        category = category_first_match.group(1).capitalize()
        amount = float(category_first_match.group(2))
        
        # Map similar categories
        if category.lower() in ['groceries', 'grocery']:
            category = 'Food'
        elif category.lower() in ['transportation', 'travel']:
            category = 'Transport'
            
        # Process exactly as above
        session['amount'] = amount
        session['category'] = category
        session['date'] = datetime.now().strftime("%d-%m-%Y")  # Default to today
        
        try:
            # Auto-generate notes
            date = datetime.now().date()
            auto_notes = generate_expense_notes(category, amount, date)
            
            # Find or create category
            category_obj = Category.query.filter_by(name=category, user_id=current_user.id).first()
            if not category_obj:
                # Try global category
                category_obj = Category.query.filter_by(name=category, user_id=None).first()
                
                if not category_obj:
                    # Create new category
                    category_obj = Category(name=category, user_id=current_user.id)
                    db.session.add(category_obj)
                    db.session.commit()  # Commit to ensure category has an ID
            
            # Create expense
            expense = Expense(
                amount=amount,
                date=date,
                time=datetime.now().time(),
                notes=auto_notes,
                category_id=category_obj.id,
                user_id=current_user.id
            )
            db.session.add(expense)
            db.session.commit()
            
            # Reset the session
            session.pop('conversation_state', None)
            session.pop('amount', None)
            session.pop('category', None)
            session.pop('date', None)
            
            return jsonify({
                "response": f"Expense added successfully! Amount: ₹{amount}, Category: {category}, Date: {date.strftime('%d-%m-%Y')}, Notes: {auto_notes}"
            })
            
        except Exception as e:
            print(f"Error adding expense: {str(e)}")
            # Reset the session
            session.pop('conversation_state', None)
            session.pop('amount', None)
            session.pop('category', None)
            session.pop('date', None)
            return jsonify({"response": f"An error occurred: {str(e)}. Let's start over. Please enter the amount."})
    
    elif only_amount_match and conversation_state == "initial":
        # Just an amount was entered, assume it's the start of an expense addition
        try:
            amount = float(only_amount_match.group(1))
            session['amount'] = amount
            session['conversation_state'] = "waiting_for_category"
            return jsonify({"response": f"Amount ₹{amount} recorded. Now, what's the category of this expense?"})
        except ValueError:
            return jsonify({"response": "Please enter a valid amount."})

    # Handle initial "add expense" commands to start the flow
    if conversation_state == "initial" and (
        user_input.lower().startswith("add an expense") or 
        user_input.lower().startswith("add expense")
    ):
        session['conversation_state'] = "waiting_for_amount"
        return jsonify({"response": "Let's add an expense. Please enter the amount."})

    # Regular flow handling
    if conversation_state == "waiting_for_amount":
        try:
            amount = float(user_input)
            session['amount'] = amount
            session['conversation_state'] = "waiting_for_category"
            return jsonify({"response": f"Amount ₹{amount} recorded. Now, what's the category of this expense?"})
        except ValueError:
            return jsonify({"response": "Please enter a valid amount."})
    
    elif conversation_state == "waiting_for_category":
        category_name = user_input.strip().capitalize()
        if not category_name:
            category_name = "Others"
        
        session['category'] = category_name
        session['conversation_state'] = "waiting_for_date"
        return jsonify({"response": f"Category: {category_name}. Now, please provide the date (DD-MM-YYYY)."})
    
    elif conversation_state == "waiting_for_date":
        try:
            date_obj = datetime.strptime(user_input, "%d-%m-%Y").date()
            session['date'] = user_input
            
            # Process the expense immediately instead of asking for notes
            try:
                # Get stored expense data
                amount = session.get('amount')
                category_name = session.get('category')
                date_str = session.get('date')
                
                print(f"Final data: amount={amount}, category={category_name}, date={date_str}")
                
                if not amount or not category_name or not date_str:
                    # Reset session
                    session.pop('conversation_state', None)
                    session.pop('amount', None)
                    session.pop('category', None)
                    session.pop('date', None)
                    return jsonify({"response": "Missing some required data. Let's start over. Please enter the amount."})
                
                # Convert date string to date object
                date = datetime.strptime(date_str, "%d-%m-%Y").date()
                
                # Auto-generate notes
                auto_notes = generate_expense_notes(category_name, amount, date)
                
                # Find or create category
                category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
                if not category:
                    # Try global category
                    category = Category.query.filter_by(name=category_name, user_id=None).first()
                    
                    if not category:
                        # Create new category
                        category = Category(name=category_name, user_id=current_user.id)
                        db.session.add(category)
                        db.session.commit()  # Commit to ensure category has an ID
                
                # Create expense
                expense = Expense(
                    amount=amount,
                    date=date,
                    time=datetime.now().time(),
                    notes=auto_notes,
                    category_id=category.id,
                    user_id=current_user.id
                )
                db.session.add(expense)
                db.session.commit()
                
                # Reset the session
                session.pop('conversation_state', None)
                session.pop('amount', None)
                session.pop('category', None)
                session.pop('date', None)
                
                return jsonify({
                    "response": f"Expense added successfully! Amount: ₹{amount}, Category: {category_name}, Date: {date_str}, Notes: {auto_notes}"
                })
                
            except Exception as e:
                print(f"Error adding expense: {str(e)}")
                # Reset the session
                session.pop('conversation_state', None)
                session.pop('amount', None)
                session.pop('category', None)
                session.pop('date', None)
                return jsonify({"response": f"An error occurred: {str(e)}. Let's start over. Please enter the amount."})
                
        except ValueError:
            return jsonify({"response": "Please enter the date in DD-MM-YYYY format."})
    
    else:
        # Initial state - start conversation
        session['conversation_state'] = "waiting_for_amount"
        session.pop('amount', None)
        session.pop('category', None)
        session.pop('date', None)
        return jsonify({"response": "Let's start by adding an expense. Please enter the amount."})


@app.route('/ai_assistant')
@login_required
def ai_assistant():
    return render_template('ai_assistant.html')


@app.route('/api/expenses', methods=['GET'])
@login_required
def get_expenses():
    """API endpoint to get user expenses"""
    try:
        # Get query parameters
        limit = request.args.get('limit', default=5, type=int)
        
        # Query expenses
        expenses = Expense.query.filter_by(user_id=current_user.id).order_by(Expense.date.desc()).limit(limit).all()
        
        # Format data
        result = []
        for expense in expenses:
            category_name = expense.expense_category.name if expense.expense_category else 'Uncategorized'
            result.append({
                'id': expense.id,
                'amount': expense.amount,
                'category': category_name,
                'date': expense.date.strftime('%d-%m-%Y'),
                'notes': expense.notes
            })
        
        return jsonify({
            'success': True,
            'data': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/expenses/analyze', methods=['GET'])
@login_required
def analyze_expenses():
    """API endpoint to analyze user expenses"""
    try:
        # Get current month
        today = datetime.today()
        start_of_month = datetime(today.year, today.month, 1)
        end_of_month = (datetime(today.year, today.month + 1, 1) if today.month < 12 
                        else datetime(today.year + 1, 1, 1)) - timedelta(days=1)
        
        # Last month
        if today.month == 1:
            last_month_start = datetime(today.year - 1, 12, 1)
            last_month_end = datetime(today.year, 1, 1) - timedelta(days=1)
        else:
            last_month_start = datetime(today.year, today.month - 1, 1)
            last_month_end = start_of_month - timedelta(days=1)
        
        # Get expenses for the time periods with proper date filtering
        current_month_expenses = Expense.query.filter_by(user_id=current_user.id).filter(
            Expense.date >= start_of_month,
            Expense.date <= end_of_month
        ).all()
        
        last_month_expenses = Expense.query.filter_by(user_id=current_user.id).filter(
            Expense.date >= last_month_start,
            Expense.date <= last_month_end
        ).all()
        
        # Calculate totals with proper handling of no expenses
        current_month_total = sum(expense.amount for expense in current_month_expenses) if current_month_expenses else 0
        last_month_total = sum(expense.amount for expense in last_month_expenses) if last_month_expenses else 0
        
        # Calculate percentage change only if both months have data, otherwise handle specially
        if last_month_total > 0 and current_month_total > 0:
            percent_change = ((current_month_total - last_month_total) / last_month_total) * 100
        elif last_month_total == 0 and current_month_total > 0:
            percent_change = 100  # Special case: no expenses last month, but we have expenses this month
        elif last_month_total > 0 and current_month_total == 0:
            percent_change = -100  # Special case: had expenses last month, but none this month
        else:
            percent_change = 0  # Special case: no expenses in either month
        
        # Get expense distribution by category
        categories = {}
        category_counts = {}
        
        # Process current month expenses for categories
        for expense in current_month_expenses:
            category_name = expense.expense_category.name if expense.expense_category else 'Uncategorized'
            
            # Update category totals
            if category_name in categories:
                categories[category_name] += expense.amount
            else:
                categories[category_name] = expense.amount
            
            # Update category counts
            if category_name in category_counts:
                category_counts[category_name] += 1
            else:
                category_counts[category_name] = 1
        
        # Find highest spending category with proper checks
        if categories:
            highest_category = max(categories.items(), key=lambda x: x[1])
            highest_name, highest_amount = highest_category
            highest_percentage = round((highest_amount / current_month_total * 100), 1) if current_month_total else 0
        else:
            highest_name, highest_amount, highest_percentage = 'None', 0, 0
        
        # Find most frequent category with proper checks
        if category_counts:
            most_frequent = max(category_counts.items(), key=lambda x: x[1])
            most_frequent_name, most_frequent_count = most_frequent
        else:
            most_frequent_name, most_frequent_count = 'None', 0
        
        # Get prior months data for trends (last 6 months)
        monthly_totals = []
        for i in range(6):
            if today.month - i <= 0:
                month_num = today.month - i + 12
                year_num = today.year - 1
            else:
                month_num = today.month - i
                year_num = today.year
                
            month_start = datetime(year_num, month_num, 1)
            month_end = (datetime(year_num, month_num + 1, 1) if month_num < 12 
                        else datetime(year_num + 1, 1, 1)) - timedelta(days=1)
                
            month_expenses = Expense.query.filter_by(user_id=current_user.id).filter(
                Expense.date >= month_start,
                Expense.date <= month_end
            ).all()
            
            month_total = sum(expense.amount for expense in month_expenses)
            month_name = month_start.strftime('%b')  # Abbreviated month name
            
            monthly_totals.append({
                'month': month_name,
                'total': month_total
            })
        
        # Reverse so most recent month is last (better for charts)
        monthly_totals.reverse()
        
        return jsonify({
            'success': True,
            'data': {
                'current_month_total': current_month_total,
                'last_month_total': last_month_total,
                'percent_change': round(percent_change, 1),
                'highest_category': {
                    'name': highest_name,
                    'amount': highest_amount,
                    'percentage': highest_percentage
                },
                'most_frequent': {
                    'name': most_frequent_name,
                    'count': most_frequent_count
                },
                'categories': categories,
                'monthly_trend': monthly_totals,
                'period': {
                    'current_month': {
                        'start': start_of_month.strftime('%d-%m-%Y'),
                        'end': end_of_month.strftime('%d-%m-%Y'),
                        'name': start_of_month.strftime('%B %Y')
                    },
                    'last_month': {
                        'start': last_month_start.strftime('%d-%m-%Y'),
                        'end': last_month_end.strftime('%d-%m-%Y'),
                        'name': last_month_start.strftime('%B %Y')
                    }
                }
            }
        })
    
    except Exception as e:
        app.logger.error(f"Error in analyze_expenses: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@login_required
def update_expense(expense_id):
    """API endpoint to update an expense"""
    try:
        expense = Expense.query.get_or_404(expense_id)
        
        # Check if the expense belongs to the user
        if expense.user_id != current_user.id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        data = request.json
        
        # Update fields if provided
        if 'amount' in data:
            expense.amount = data['amount']
        
        if 'category' in data:
            category_name = data['category']
            category = Category.query.filter_by(name=category_name, user_id=current_user.id).first()
            
            if not category:
                # Try global category
                category = Category.query.filter_by(name=category_name, user_id=None).first()
                
                if not category:
                    # Create new category
                    category = Category(name=category_name, user_id=current_user.id)
                    db.session.add(category)
                    db.session.commit()  # Commit to ensure category has an ID
            
            expense.category_id = category.id
        
        if 'date' in data:
            try:
                expense.date = datetime.strptime(data['date'], '%d-%m-%Y').date()
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format. Use DD-MM-YYYY'
                }), 400
        
        if 'notes' in data:
            expense.notes = data['notes']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense updated successfully'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@login_required
def delete_expense_api(expense_id):
    """API endpoint to delete an expense"""
    try:
        expense = Expense.query.get_or_404(expense_id)
        
        # Check if the expense belongs to the user
        if expense.user_id != current_user.id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        db.session.delete(expense)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': 'Expense deleted successfully'
        })
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/budget/tips', methods=['GET'])
@login_required
def get_budget_tips():
    """API endpoint to get personalized budget tips"""
    try:
        # Get category parameter
        category = request.args.get('category', '').lower()
        use_ai = request.args.get('use_ai', 'false').lower() == 'true'
        
        # If AI is requested and there's an OpenAI API key, use AI for personalized advice
        if use_ai and os.getenv("OPENAI_API_KEY"):
            from openai_integration import get_personalized_budget_advice
            
            # Get personalized advice based on spending patterns
            advice = get_personalized_budget_advice(current_user.id, category if category else None)
            
            return jsonify({
                'success': True,
                'data': {
                    'category': category if category else 'general',
                    'ai_tip': advice,
                    'is_ai_generated': True
                }
            })
        
        # Otherwise, use predefined tips (saves API costs)
        tips = {
            'food': [
                "Plan your meals for the week and make a grocery list",
                "Cook in bulk and freeze leftovers",
                "Use cashback apps for grocery shopping",
                "Limit eating out to once a week",
                "Bring lunch to work instead of buying"
            ],
            'transport': [
                "Use public transportation when possible",
                "Consider carpooling with colleagues",
                "Maintain your vehicle regularly to prevent costly repairs",
                "Compare gas prices using apps",
                "Consider biking or walking for short distances"
            ],
            'entertainment': [
                "Look for free events in your community",
                "Use streaming services instead of cable",
                "Take advantage of library resources",
                "Look for happy hour deals and restaurant specials",
                "Use discount apps for movie tickets and events"
            ],
            'bills': [
                "Review subscriptions and cancel unused ones",
                "Negotiate with service providers for better rates",
                "Consider bundling services for discounts",
                "Switch to energy-efficient appliances",
                "Use programmable thermostats to reduce energy costs"
            ],
            'general': [
                "Follow the 50/30/20 rule: 50% needs, 30% wants, 20% savings",
                "Create and stick to a monthly budget",
                "Set up automatic transfers to savings accounts",
                "Use cash envelopes for discretionary spending",
                "Review your budget regularly and adjust as needed"
            ]
        }
        
        # If category is specified and exists in tips
        if category and category in tips:
            return jsonify({
                'success': True,
                'data': {
                    'category': category,
                    'tips': tips[category],
                    'is_ai_generated': False
                }
            })
        
        # Otherwise return general tips
        return jsonify({
            'success': True,
            'data': {
                'categories': list(tips.keys()),
                'general_tips': tips['general'],
                'is_ai_generated': False
            }
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/expenses/search', methods=['GET'])
@login_required
def search_expenses():
    """API endpoint to search and filter expenses"""
    try:
        # Get query parameters
        keyword = request.args.get('keyword', '')
        category_id = request.args.get('category_id', type=int)
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')
        min_amount = request.args.get('min_amount', type=float)
        max_amount = request.args.get('max_amount', type=float)
        limit = request.args.get('limit', default=50, type=int)
        
        # Start with the base query
        query = Expense.query.filter_by(user_id=current_user.id)
        
        # Apply filters if they exist
        if keyword:
            # Full text search on notes field and case-insensitive category name
            query = query.join(Category).filter(
                db.or_(
                    Expense.notes.ilike(f'%{keyword}%'),
                    Category.name.ilike(f'%{keyword}%')
                )
            )
        
        if category_id:
            query = query.filter(Expense.category_id == category_id)
            
        if start_date and end_date:
            try:
                start = datetime.strptime(start_date, '%d-%m-%Y').date()
                end = datetime.strptime(end_date, '%d-%m-%Y').date()
                query = query.filter(Expense.date.between(start, end))
            except ValueError:
                return jsonify({
                    'success': False,
                    'error': 'Invalid date format. Use DD-MM-YYYY'
                }), 400
                
        if min_amount is not None:
            query = query.filter(Expense.amount >= min_amount)
            
        if max_amount is not None:
            query = query.filter(Expense.amount <= max_amount)
        
        # Order by date (newest first) and apply limit
        expenses = query.order_by(Expense.date.desc()).limit(limit).all()
        
        # Format the response
        result = []
        for expense in expenses:
            category_name = expense.expense_category.name if expense.expense_category else 'Uncategorized'
            result.append({
                'id': expense.id,
                'amount': expense.amount,
                'category': category_name,
                'date': expense.date.strftime('%d-%m-%Y'),
                'notes': expense.notes,
                'receipt_path': expense.receipt_path if hasattr(expense, 'receipt_path') else None
            })
        
        return jsonify({
            'success': True,
            'count': len(result),
            'data': result
        })
    
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/expenses/<int:expense_id>/upload_receipt', methods=['POST'])
@login_required
def upload_receipt(expense_id):
    """API endpoint to upload a receipt for an existing expense"""
    try:
        expense = Expense.query.get_or_404(expense_id)
        
        # Check if the expense belongs to the user
        if expense.user_id != current_user.id:
            return jsonify({
                'success': False,
                'error': 'Unauthorized'
            }), 403
        
        # Check if a file was uploaded
        if 'receipt' not in request.files:
            return jsonify({
                'success': False,
                'error': 'No file part'
            }), 400
        
        file = request.files['receipt']
        
        # Check if the file was actually selected
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': 'No file selected'
            }), 400
        
        # Check if the file type is allowed
        if file and allowed_file(file.filename):
            # Create a secure filename with UUID to prevent duplicates
            filename = secure_filename(file.filename)
            file_ext = filename.rsplit('.', 1)[1].lower()
            unique_filename = f"{uuid.uuid4().hex}.{file_ext}"
            
            # Create user folder if it doesn't exist
            user_upload_dir = os.path.join(app.config['UPLOAD_FOLDER'], str(current_user.id))
            os.makedirs(user_upload_dir, exist_ok=True)
            
            # Delete old receipt if exists
            if expense.receipt_path:
                try:
                    old_file_path = os.path.join('static', expense.receipt_path)
                    if os.path.exists(old_file_path):
                        os.remove(old_file_path)
                except Exception as e:
                    print(f"Error removing old receipt: {str(e)}")
            
            # Save the file
            file_path = os.path.join(user_upload_dir, unique_filename)
            file.save(file_path)
            
            # Store the path WITHOUT the 'static/' prefix since url_for('static', filename=...) will add it
            receipt_path = os.path.join('uploads/receipts', str(current_user.id), unique_filename)
            expense.receipt_path = receipt_path
            db.session.commit()
            
            return jsonify({
                'success': True,
                'message': 'Receipt uploaded successfully',
                'receipt_path': receipt_path
            })
        else:
            return jsonify({
                'success': False,
                'error': f'Invalid file type. Allowed types: {", ".join(ALLOWED_EXTENSIONS)}'
            }), 400
    
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/search_expenses', methods=['GET'])
@login_required
def search_expenses_page():
    """Page for advanced search and filtering of expenses"""
    form = SearchForm(request.args, meta={'csrf': False})
    
    # Get all categories for the user and global categories for the dropdown
    user_categories = Category.query.filter_by(user_id=current_user.id).all()
    global_categories = Category.query.filter_by(user_id=None).all()
    
    # Combine them for the dropdown, starting with 'All' option
    all_categories = [(0, 'All')]
    for cat in user_categories:
        all_categories.append((cat.id, cat.name))
    for cat in global_categories:
        all_categories.append((cat.id, cat.name))
    
    form.category.choices = all_categories

    expenses = []
    search_performed = False
    
    # If form was submitted with search parameters
    if any(field in request.args for field in ['keyword', 'category', 'start_date', 'end_date', 'min_amount', 'max_amount']):
        search_performed = True
        # Start with base query
        query = Expense.query.filter_by(user_id=current_user.id)
        
        # Apply filters
        if form.keyword.data:
            query = query.join(Category).filter(
                db.or_(
                    Expense.notes.ilike(f'%{form.keyword.data}%'),
                    Category.name.ilike(f'%{form.keyword.data}%')
                )
            )
        
        if form.category.data and form.category.data > 0:
            query = query.filter(Expense.category_id == form.category.data)
        
        if form.start_date.data and form.end_date.data:
            try:
                start = datetime.strptime(form.start_date.data, '%d-%m-%Y').date()
                end = datetime.strptime(form.end_date.data, '%d-%m-%Y').date()
                query = query.filter(Expense.date.between(start, end))
            except ValueError:
                flash('Invalid date format. Use DD-MM-YYYY', 'danger')
        
        if form.min_amount.data is not None:
            query = query.filter(Expense.amount >= form.min_amount.data)
        
        if form.max_amount.data is not None:
            query = query.filter(Expense.amount <= form.max_amount.data)
        
        # Get results
        expenses = query.order_by(Expense.date.desc()).all()
        
        if not expenses:
            flash('No expenses found matching your search criteria.', 'info')
    
    return render_template(
        'search_expenses.html',
        form=form,
        expenses=expenses,
        search_performed=search_performed
    )


@app.route('/view_receipt/<int:expense_id>')
@login_required
def view_receipt(expense_id):
    """Route to view a receipt file"""
    try:
        expense = Expense.query.get_or_404(expense_id)
        
        # Check if the expense belongs to the user
        if expense.user_id != current_user.id:
            flash('Unauthorized access.', 'danger')
            return redirect(url_for('dashboard'))
        
        # Check if receipt exists
        if not expense.receipt_path:
            flash('No receipt found for this expense.', 'warning')
            return redirect(url_for('search_expenses_page'))
        
        # Construct the full file path
        file_path = os.path.join('static', expense.receipt_path)
        
        # Check if file exists
        if not os.path.exists(file_path):
            flash('Receipt file not found.', 'danger')
            return redirect(url_for('search_expenses_page'))
        
        # Determine content type based on file extension
        file_ext = file_path.rsplit('.', 1)[1].lower()
        if file_ext == 'pdf':
            mimetype = 'application/pdf'
        elif file_ext in ['jpg', 'jpeg']:
            mimetype = 'image/jpeg'
        elif file_ext == 'png':
            mimetype = 'image/png'
        else:
            mimetype = 'application/octet-stream'
        
        # Get a meaningful filename
        original_filename = os.path.basename(file_path)
        category_name = expense.expense_category.name
        date_str = expense.date.strftime('%Y-%m-%d')
        download_filename = f"{category_name}_{date_str}_{original_filename}"
        
        # Set as_attachment=True to force download
        return send_file(
            file_path, 
            mimetype=mimetype,
            as_attachment=True,
            download_name=download_filename
        )
    
    except Exception as e:
        flash(f'Error viewing receipt: {str(e)}', 'danger')
        return redirect(url_for('search_expenses_page'))


@app.route('/api/expenses/predict', methods=['GET'])
@login_required
def predict_expenses():
    """API endpoint to predict future expenses"""
    try:
        # Get number of months to predict (default is 3)
        months = request.args.get('months', default=3, type=int)
        
        # Limit months between 1-12 for reasonable predictions
        if months < 1:
            months = 1
        elif months > 12:
            months = 12
            
        # Get the user's expense count
        expense_count = Expense.query.filter_by(user_id=current_user.id).count()
        
        # If there are too few expenses, return an informative error
        if expense_count < 5:
            return jsonify({
                'success': False,
                'message': f"Not enough expense data to make accurate predictions. You currently have {expense_count} expenses, but at least 5 are needed."
            })
            
        # Import the prediction function
        from openai_integration import predict_future_expenses
        
        # Generate predictions
        result = predict_future_expenses(current_user.id, months)
        
        return jsonify(result)
    
    except Exception as e:
        app.logger.error(f"Error in predict_expenses: {str(e)}")
        return jsonify({
            'success': False,
            'message': f"An error occurred while generating predictions: {str(e)}"
        }), 500


@app.route('/expense_prediction')
@login_required
def expense_prediction_page():
    """Page for viewing expense predictions"""
    # Default to 3 months
    months = request.args.get('months', default=3, type=int)
    
    # Limit months between 1-12 for reasonable predictions
    if months < 1:
        months = 1
    elif months > 12:
        months = 12
        
    return render_template('expense_prediction.html', months=months)

@app.route('/health')
def health_check():
    """Health check endpoint to verify database connectivity"""
    try:
        # Test database connection
        db.session.execute('SELECT 1')
        db.session.commit()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.now().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e),
            'timestamp': datetime.now().isoformat()
        }), 500

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
        app.run(debug=True)
