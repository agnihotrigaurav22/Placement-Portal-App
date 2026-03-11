import os
from flask import Flask, render_template, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash
from config import Config
from models import db, User
from extensions import cache, jwt

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    jwt.init_app(app)
    CORS(app)
    cache.init_app(app)

    # Note: Import routes later to avoid circular dependencies
    from auth import auth_bp
    from routes import api_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(api_bp, url_prefix='/api')

    @app.route('/')
    def index():
        return render_template('index.html')

    @app.route('/<path:path>')
    def catch_all(path):
        return render_template('index.html')

    return app

def setup_db(app):
    with app.app_context():
        db.create_all()
        admin = User.query.filter_by(role='admin').first()
        if not admin:
            hashed_pwd = generate_password_hash('admin123', method='pbkdf2:sha256')
            admin = User(email='admin@institute.edu', password=hashed_pwd, role='admin')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created.")

