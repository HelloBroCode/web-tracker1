import os
from app import app, db
from models import User, Category, Expense

db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
if os.path.exists(db_path):
    os.remove(db_path)

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