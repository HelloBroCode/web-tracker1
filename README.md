# Web-Based Expense Tracker with Visualization and Export

A modern, feature-rich expense tracking application built with Flask and Bootstrap that helps users track, categorize, search, and analyze their expenses with data visualization and AI-powered insights.

![Dashboard](screenshots/dashboard.png)

## Features

- **Expense Management**
  - Add, view, edit and delete expenses
  - Automatic categorization
  - Receipt image/PDF upload and management
  - Auto-generated expense notes

- **Advanced Search & Filtering**
  - Full-text search across notes and categories
  - Multi-criteria filtering (date range, category, amount range)
  - Sort and organize expenses

- **Data Visualization**
  - Category-based pie charts
  - Time-series spending trends
  - Interactive charts using Plotly

- **Powerful Export Options**
  - Export to CSV for spreadsheet analysis
  - Export to PDF for printing and sharing

- **AI Assistant (FinMate)**
  - Natural language expense input
  - Spending analysis and insights
  - Personalized budget recommendations

- **User Authentication**
  - Secure login and registration
  - User-specific expense tracking

## Installation

### Prerequisites
- Python 3.7+
- pip

### Setup

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/expense-tracker.git
   cd expense-tracker
   ```

2. Create a virtual environment (recommended):
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Set up environment variables (optional for AI features):
   - Create a file named `key.env` in the root directory
   - Add your OpenAI API key: `OPENAI_API_KEY=your_api_key_here`

5. Initialize the database:
   ```
   python migrate_db.py
   ```

6. Run the application:
   ```
   python app.py
   ```

7. Access the application in your browser:
   ```
   http://127.0.0.1:5000/
   ```

## Usage Guide

### Adding Expenses
1. Navigate to the dashboard
2. Fill in the expense amount, category, and date
3. Optionally upload a receipt (image or PDF)
4. Click "Add Expense"

### Searching and Filtering
1. Click on "Advanced Search" in the navigation
2. Use any combination of search criteria:
   - Keyword search (searches notes and category names)
   - Category filter
   - Date range
   - Amount range
3. Click "Search" to see filtered results

### Viewing and Analyzing Expenses
1. Click on "View Expenses" to see all expenses
2. Use filters to narrow down expenses by date range or category
3. Visualize your spending with automatically generated charts:
   - Pie chart shows distribution by category
   - Bar chart shows spending over time

### Managing Receipts
1. Upload receipts when adding expenses
2. Add receipts to existing expenses via the search page
3. View receipts by clicking the "View" button
4. Receipts will download automatically for viewing

### Exporting Data
1. Navigate to the "View Expenses" page
2. Apply any filters you want
3. Click "Export CSV" or "Export PDF" to download your expense data

### Using FinMate AI Assistant
1. Click on "Talk to FinMate" on the dashboard
2. You can:
   - Add expenses with natural language ("I spent ₹500 on food yesterday")
   - Ask for spending insights ("How much did I spend on food this month?")
   - Get budget recommendations ("How can I reduce my transport expenses?")

## Technology Stack

- **Backend**: Flask (Python)
- **Database**: SQLite with SQLAlchemy ORM
- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5
- **Data Visualization**: Plotly
- **PDF Generation**: ReportLab
- **AI Integration**: OpenAI API (optional)

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Contribution

Contributions are welcome! Please feel free to submit a Pull Request. 