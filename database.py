from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    id = db.Column(db.String(50), primary_key=True)
    points = db.Column(db.Float, default=0)
    points_active = db.Column(db.Boolean, default=False)
    last_activity = db.Column(db.DateTime, default=db.func.now())

def init_db():
    db.create_all()