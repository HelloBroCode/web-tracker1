import os
from app import app, db
from models import Category

db_path = app.config['SQLALCHEMY_DATABASE_URI'].replace('sqlite:///', '')
if not os.path.exists(db_path):
    os.makedirs(os.path.dirname(db_path), exist_ok=True)

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

print("Database migration completed successfully!") 