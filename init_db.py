#!/usr/bin/env python3
"""
Database initialization script for the expense tracker application.
This script can be run manually to initialize the database tables and default categories.
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables
load_dotenv(dotenv_path="key.env")

# Add the current directory to Python path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import Category

def init_database():
    """Initialize the database with tables and default categories"""
    try:
        with app.app_context():
            print("Creating database tables...")
            db.create_all()
            print("Database tables created successfully!")
            
            # Check if global categories already exist
            if Category.query.filter_by(user_id=None).count() == 0:
                print("Creating default categories...")
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
            else:
                print("Default categories already exist")
            
            print("Database initialization completed successfully!")
            return True
            
    except Exception as e:
        print(f"Error initializing database: {str(e)}")
        return False

if __name__ == "__main__":
    print("Starting database initialization...")
    success = init_database()
    if success:
        print("Database initialization completed successfully!")
        sys.exit(0)
    else:
        print("Database initialization failed!")
        sys.exit(1) 