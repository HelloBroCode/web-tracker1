# Expense Tracker - Technical Documentation

This document provides detailed technical information about the implementation, architecture, and features of the Web-Based Expense Tracker application.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Structure](#database-structure)
3. [Core Features Implementation](#core-features-implementation)
4. [File Structure](#file-structure)
5. [API Endpoints](#api-endpoints)
6. [Advanced Features](#advanced-features)
7. [Security Considerations](#security-considerations)
8. [Deployment Guide](#deployment-guide)
9. [Troubleshooting](#troubleshooting)

## Architecture Overview

The Expense Tracker uses a Model-View-Controller (MVC) architecture:

- **Model**: SQLAlchemy models represent database structure (User, Expense, Category)
- **View**: Jinja2 templates render the UI
- **Controller**: Flask routes handle requests and business logic

### Technology Stack

- **Backend Framework**: Flask
- **Database**: SQLite (development), can be migrated to PostgreSQL/MySQL for production
- **ORM**: SQLAlchemy
- **Authentication**: Flask-Login
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Data Visualization**: Plotly
- **PDF Generation**: ReportLab
- **Form Handling**: Flask-WTF
- **File Uploads**: Werkzeug utilities
- **AI Integration**: OpenAI API

## Database Structure

### Entity Relationship Diagram

```
User (1) --< Expense (N)
User (1) --< Category (N)
Category (1) --< Expense (N)
```

### Models

#### User
- id (Primary Key)
- username (String, unique)
- email (String, unique)
- password (String, hashed)
- expenses (Relationship to Expense)
- categories (Relationship to Category)

#### Category
- id (Primary Key)
- name (String)
- user_id (Foreign Key to User, nullable for global categories)
- expenses (Relationship to Expense)

#### Expense
- id (Primary Key)
- amount (Float)
- date (Date)
- time (Time)
- notes (String)
- category_id (Foreign Key to Category)
- user_id (Foreign Key to User)
- receipt_path (String, nullable)

## Core Features Implementation

### User Authentication

- Registration, login, and logout functionality using Flask-Login
- Password hashing with Werkzeug security utilities
- Session management with Flask session

### Expense Management

#### Adding Expenses
- Form validation with Flask-WTF
- Date handling with Python's datetime
- Auto-generated notes based on expense details
- Receipt file upload with secure filename generation

#### Viewing Expenses
- Filtering by date range and category
- Pagination for large datasets
- Data visualization with Plotly charts

#### Searching Expenses
- Full-text search across notes and categories
- Multi-criteria filtering (date, category, amount)
- Dynamic SQL query building

#### Receipt Management
- File upload handling with Werkzeug
- Secure filename generation with UUID
- File serving with proper MIME type detection
- Automatic file downloading

### Data Export

- CSV export using Pandas DataFrame
- PDF generation with ReportLab
- Filtered data export based on search criteria

### AI Assistant (FinMate)

- Natural language processing with OpenAI API
- Conversation state management in Flask sessions
- Pattern matching for direct expense detection
- Personalized budget advice generation

## File Structure

```
project_root/
│
├── app.py                  # Main application entry point
├── models.py               # Database models
├── forms.py                # Form classes
├── extensions.py           # Flask extensions setup
├── key.env                 # Environment variables (not version controlled)
├── migrate_db.py           # Database migration script
├── openai_integration.py   # OpenAI API integration (optional)
├── requirements.txt        # Python dependencies
│
├── static/                 # Static assets
│   ├── css/                # CSS files
│   ├── js/                 # JavaScript files
│   ├── uploads/            # Uploaded files
│   │   └── receipts/       # Receipt uploads
│   └── sounds/             # Notification sounds
│
├── templates/              # Jinja2 templates
│   ├── base.html           # Base template
│   ├── dashboard.html      # Dashboard page
│   ├── login.html          # Login page
│   ├── register.html       # Registration page
│   ├── view_expenses.html  # View expenses page
│   ├── search_expenses.html # Search page
│   └── ai_assistant.html   # FinMate assistant page
│
└── instance/               # Instance-specific files
    └── site.db             # SQLite database
```

## API Endpoints

The application provides several REST API endpoints for AJAX functionality:

### Expense Management

- `GET /api/expenses` - Get recent expenses
- `GET /api/expenses/search` - Search and filter expenses
- `GET /api/expenses/analyze` - Get expense analysis data
- `PUT /api/expenses/<expense_id>` - Update an expense
- `DELETE /api/expenses/<expense_id>` - Delete an expense
- `POST /api/expenses/<expense_id>/upload_receipt` - Upload a receipt

### AI Assistant

- `POST /finmate` - Interact with the AI assistant

## Advanced Features

### Receipt Management

The receipt management system:
1. Accepts image (JPG, PNG) and PDF files
2. Securely stores files with UUID-based filenames
3. Organizes receipts in user-specific folders
4. Serves files for viewing with correct MIME types
5. Handles file downloads with appropriate headers

#### Receipt Upload Implementation

```python
@app.route('/api/expenses/<int:expense_id>/upload_receipt', methods=['POST'])
@login_required
def upload_receipt(expense_id):
    # Implementation details...
    # 1. Validate user owns the expense
    # 2. Check file is valid and allowed type
    # 3. Generate secure filename with UUID
    # 4. Save to user-specific directory
    # 5. Store path in database
```

#### Receipt Viewing Implementation

```python
@app.route('/view_receipt/<int:expense_id>')
@login_required
def view_receipt(expense_id):
    # Implementation details...
    # 1. Validate user owns the expense
    # 2. Check receipt exists
    # 3. Determine correct MIME type
    # 4. Serve file as downloadable attachment
```

### Advanced Search & Filtering

The search system dynamically builds SQL queries based on user input:
- Keyword search uses SQL LIKE operators on notes and category names
- Date range filtering uses SQLAlchemy's between() operator
- Amount range uses comparison operators
- Multiple filters can be combined with AND logic

### Data Visualization

The application uses Plotly to generate:
- Pie charts showing expense distribution by category
- Bar charts showing expenses over time
- Interactive charts with hover information

## Security Considerations

### Password Security
- Passwords are hashed using Werkzeug's generate_password_hash()
- No plaintext passwords are stored

### File Upload Security
- Filename sanitization with Werkzeug's secure_filename()
- File type validation before storage
- User-specific storage folders to prevent access to other users' receipts

### User Data Protection
- User-specific expense records
- Authentication required for all sensitive operations
- Proper validation for all API endpoints

## Deployment Guide

### Production Setup

For deploying to production, consider the following:

1. Use a production-ready WSGI server (Gunicorn, uWSGI)
2. Set `DEBUG=False` in production
3. Use environment variables for sensitive configuration
4. Consider upgrading to a production database (PostgreSQL, MySQL)
5. Implement proper logging
6. Add HTTPS with a valid SSL certificate

### Example Production Setup with Gunicorn and Nginx

```
# Install production dependencies
pip install gunicorn

# Run with Gunicorn
gunicorn -w 4 -b 127.0.0.1:8000 app:app
```

Nginx configuration:
```
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /static {
        alias /path/to/your/app/static;
    }
}
```

## Troubleshooting

### Common Issues

#### Database Migration Issues
- Ensure SQLAlchemy models are correctly defined
- Run `python migrate_db.py` to update database schema
- Check that the instance folder has write permissions

#### File Upload Issues
- Verify upload directory permissions
- Check maximum file size configuration
- Ensure proper form enctype (multipart/form-data)

#### AI Assistant Issues
- Verify OpenAI API key is correctly set in key.env
- Check API rate limits and quotas
- Ensure proper exception handling around API calls 