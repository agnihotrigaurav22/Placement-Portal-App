import os
from datetime import timedelta

class Config:
    SECRET_KEY = 'super-secret-key-change-in-prod'
    SQLALCHEMY_DATABASE_URI = 'sqlite:///ppa_database.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_SECRET_KEY = 'super-secret-jwt-key'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=1)
    
    CACHE_TYPE = 'SimpleCache'
    CACHE_REDIS_HOST = 'localhost'
    CACHE_REDIS_PORT = 6379
    CACHE_REDIS_DB = 0
    CACHE_DEFAULT_TIMEOUT = 300
    
    CELERY_BROKER_URL = 'redis://localhost:6379/1'
    CELERY_RESULT_BACKEND = 'redis://localhost:6379/2'
    
    # Mail (Google Gmail SMTP)
    MAIL_SERVER = 'smtp.gmail.com'
    MAIL_PORT = 587 
    MAIL_USE_TLS = True
    MAIL_USE_SSL = False
    MAIL_USERNAME = 'agnihotrigaurav659@gmail.com'  
    MAIL_PASSWORD = 'krbwipuvxaddavsl'
    
