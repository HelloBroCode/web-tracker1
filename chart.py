import plotly.express as px
import matplotlib.pyplot as plt
from io import BytesIO
from models import Expense, Category


def create_pie_chart(expenses):
    categories = [expense.expense_category.name for expense in expenses]
    amounts = [expense.amount for expense in expenses]
    fig, ax = plt.subplots()
    ax.pie(amounts, labels=categories, autopct='%1.1f%%')
    img_stream = BytesIO()
    plt.savefig(img_stream, format='png')
    img_stream.seek(0)
    return img_stream.getvalue()


def create_line_chart(expenses):
    dates = [expense.date for expense in expenses]
    amounts = [expense.amount for expense in expenses]
    fig, ax = plt.subplots()
    ax.plot(dates, amounts)
    img_stream = BytesIO()
    plt.savefig(img_stream, format='png')
    img_stream.seek(0)
    return img_stream.getvalue()

