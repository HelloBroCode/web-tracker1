from extensions import db
from app import app
from models import User, Category, Expense

with app.app_context():
    db.create_all()
    default_categories = [
        Category(name='Food'),
        Category(name='Transport'),
        Category(name='Entertainment'),
        Category(name='Bills'),
        Category(name='Others')
    ]
    db.session.add_all(default_categories)
    db.session.commit()
