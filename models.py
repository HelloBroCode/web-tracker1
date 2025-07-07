from extensions import db
from flask_login import UserMixin

class User(db.Model, UserMixin):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    expenses = db.relationship('Expense', backref='user', lazy=True)
    categories = db.relationship('Category', backref='user', lazy=True)

    conversation_state = db.Column(db.String(50), default='initial')
    last_inputs = db.Column(db.PickleType, default=dict)

    def get_conversation_state(self):
        return self.conversation_state or "initial"

    def update_conversation_state(self, state):
        self.conversation_state = state
        db.session.commit()

    def get_last_input(self, key):
        if self.last_inputs is None:
            self.last_inputs = {}
        return self.last_inputs.get(key)

    def update_last_input(self, key, value):
        if self.last_inputs is None:
            self.last_inputs = {}
        self.last_inputs[key] = value
        db.session.commit()

class Category(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)
    expenses = db.relationship('Expense', backref='expense_category', lazy=True)

class Expense(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.Date, nullable=False)
    time = db.Column(db.Time)
    notes = db.Column(db.String(200))
    category_id = db.Column(db.Integer, db.ForeignKey('category.id'), nullable=False)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    receipt_path = db.Column(db.String(255), nullable=True)
