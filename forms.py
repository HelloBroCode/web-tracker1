from flask_wtf import FlaskForm
from flask_wtf.file import FileField, FileAllowed
from wtforms import StringField, PasswordField, SubmitField, FloatField, SelectField, BooleanField, DateField
from wtforms.validators import DataRequired, Email, EqualTo, Length, ValidationError, Optional, NumberRange
from models import User
from flask_login import current_user

class RegisterForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=100)])
    email = StringField('Email', validators=[DataRequired(), Email()])
    password = PasswordField('Password', validators=[DataRequired(), Length(min=6)])
    confirm_password = PasswordField('Confirm Password', validators=[DataRequired(), EqualTo('password')])
    submit = SubmitField('Register')

    def validate_username(self, username):
        if User.query.filter_by(username=username.data).first():
            raise ValidationError('Username already taken.')

    def validate_email(self, email):
        if User.query.filter_by(email=email.data).first():
            raise ValidationError('Email already registered.')

class LoginForm(FlaskForm):
    username = StringField('Username', validators=[DataRequired(), Length(min=2, max=100)])
    password = PasswordField('Password', validators=[DataRequired()])
    remember = BooleanField('Remember Me')
    submit = SubmitField('Login')

class ExpenseForm(FlaskForm):
    amount = FloatField('Amount', validators=[DataRequired(), NumberRange(min=0.01)])
    date = DateField('Date', validators=[DataRequired()])
    category = SelectField('Category', coerce=int, validators=[DataRequired()])
    notes = StringField('Notes', validators=[Length(max=200)])
    receipt = FileField('Receipt')
    submit = SubmitField('Add Expense')

class ExpenseFilterForm(FlaskForm):
    start_date = StringField('Start Date')
    end_date = StringField('End Date')
    category = SelectField('Category', coerce=int)
    submit = SubmitField('Filter')

class SearchForm(FlaskForm):
    keyword = StringField('Keyword')
    category = SelectField('Category', coerce=int)
    start_date = StringField('Start Date')
    end_date = StringField('End Date')
    min_amount = FloatField('Min Amount')
    max_amount = FloatField('Max Amount')
    submit = SubmitField('Search')
