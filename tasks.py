import os
import sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import csv
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from celery import Celery
from celery.schedules import crontab
from models import db, User, PlacementDrive, Application, StudentProfile
from datetime import datetime, timedelta
import logging

def make_celery(app_name=__name__):
    celery = Celery(
        app_name,
        broker='redis://localhost:6379/1',
        backend='redis://localhost:6379/2'
    )
    return celery

celery_app = make_celery()


@celery_app.task
def export_applications_csv(student_id):
    from app import create_app
    app = create_app()
    with app.app_context():
        student = StudentProfile.query.get(student_id)
        if not student:
            return "Student not found"
            
        applications = Application.query.filter_by(student_id=student.id).all()
        
        filename = f"applications_export_{student_id}.csv"
        filepath = os.path.join(app.root_path, 'static', filename)
        
        with open(filepath, 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['Student ID', 'Company Name', 'Drive Title', 'Application Status', 'Application Date'])
            for app_rec in applications:
                writer.writerow([
                    student_id,
                    app_rec.drive.company.company_name,
                    app_rec.drive.job_title,
                    app_rec.status,
                    app_rec.application_date.isoformat()
                ])
        
        alert_msg = f"Alert: The CSV export for {student.name}'s placement applications is generated! Link: /static/{filename}"
        print(alert_msg)
        return filepath

@celery_app.task
def daily_reminders():
    from app import create_app
    app = create_app()
    with app.app_context():
        import smtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart
        from models import db, User, PlacementDrive

        print("Running daily reminders...")
        upcoming_deadline_date = datetime.utcnow() + timedelta(days=3)
        
        # Drives closing within the next 3 days
        upcoming_drives = PlacementDrive.query.filter(
            PlacementDrive.status == 'Approved',
            PlacementDrive.application_deadline > datetime.utcnow(),
            PlacementDrive.application_deadline <= upcoming_deadline_date
        ).all()
        
        if not upcoming_drives:
            print("No upcoming deadlines. Skipping reminders.")
            return
            
        
        html_list = ""
        for drive in upcoming_drives:
            deadline_str = drive.application_deadline.strftime('%Y-%m-%d')
            html_list += f"<li><b>{drive.job_title}</b> at {drive.company.company_name} (Deadline: {deadline_str})</li>"
        
        # Send Email to all active students
        students = User.query.filter_by(role='student', active=True).all()
        if not students:
            print("No active students found for email reminders.")
            return

        student_emails = [student.email for student in students]
        
        html_content = f"""
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f8f9fa; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); padding: 30px; border-top: 5px solid #dc3545;">
                <h2 style="color: #dc3545; margin-top: 0;">Upcoming Deadline Reminders</h2>
                <p>Hello Student,</p>
                <p>This is an automated reminder that the following placement drives are <strong>closing within the next 3 days</strong>. Ensure you complete your applications in time if you meet the eligibility criteria:</p>
                
                <ul style="background-color: #f8f9fa; padding: 20px 40px; border-radius: 6px; border-left: 4px solid #0d6efd;">
                    {html_list}
                </ul>
                
                <p style="margin-top: 30px;">Best Regards,<br><strong>Placement Portal Application</strong></p>
            </div>
        </body>
        </html>
        """
        
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = "Action Required: Upcoming Placement Drive Deadlines!"
            msg['From'] = app.config.get('MAIL_USERNAME', 'system@institute.edu')
            # Use Bcc so students cannot see other student's email addresses
            msg['To'] = app.config.get('MAIL_USERNAME', 'system@institute.edu')
            msg['Bcc'] = ", ".join(student_emails)
            
            part = MIMEText(html_content, 'html')
            msg.attach(part)
            
            # Setup SMTP connection - Using real SMTP server instead of mock
            server_host = app.config.get('MAIL_SERVER', 'smtp.gmail.com')
            server_port = app.config.get('MAIL_PORT', 587)
            server = smtplib.SMTP(server_host, server_port)
            
            if app.config.get('MAIL_USE_TLS', True):
                server.starttls()
            
            username = app.config.get('MAIL_USERNAME')
            password = app.config.get('MAIL_PASSWORD')
            if username and password:
                server.login(username, password)
                
            server.send_message(msg)
            server.quit()
            print(f"Daily reminders successfully sent via email to {len(student_emails)} students.")
        except Exception as e:
            print(f"Mail failed to send: {e}")
            
        print("Daily Reminders job executed.")

@celery_app.task
def monthly_activity_report(test_current_month=False):
    from app import create_app
    app = create_app()
    with app.app_context():
        import smtplib
        from datetime import datetime, timedelta
        from email.message import EmailMessage
        from sqlalchemy import func
        from models import db, User, PlacementDrive, Application

        print(f"Running monthly report generation... (Testing Mode: {test_current_month})")

        today = datetime.utcnow()
        first_day_of_current_month = datetime(today.year, today.month, 1)
        
        if test_current_month:
            
            first_day_of_target_month = first_day_of_current_month
            
            temp_next_month = today.month + 1
            temp_next_year = today.year
            if temp_next_month > 12:
                temp_next_month = 1
                temp_next_year += 1
            first_day_of_next_month = datetime(temp_next_year, temp_next_month, 1)
        else:
            
            last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
            first_day_of_target_month = datetime(last_day_of_previous_month.year, last_day_of_previous_month.month, 1)
            first_day_of_next_month = first_day_of_current_month
            
        month_name = first_day_of_target_month.strftime("%B %Y")

        
        drives_conducted = PlacementDrive.query.filter(
            PlacementDrive.created_at >= first_day_of_target_month,
            PlacementDrive.created_at < first_day_of_next_month
        ).count()

        students_applied = db.session.query(Application.student_id).filter(
            Application.application_date >= first_day_of_target_month,
            Application.application_date < first_day_of_next_month
        ).distinct().count()

        students_selected = db.session.query(Application.student_id).filter(
            Application.status == 'Selected',
            Application.application_date >= first_day_of_target_month,
            Application.application_date < first_day_of_next_month
        ).distinct().count()
        
        html_content = f"""
        <html>
        <head>
            <style>
                body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; background-color: #f4f7f6; margin: 0; padding: 0; }}
                .container {{ max-width: 600px; margin: 30px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); border-top: 5px solid #0d6efd; }}
                .header {{ padding: 25px 30px; background-color: #f8f9fa; border-bottom: 1px solid #e9ecef; }}
                .header h1 {{ margin: 0; color: #0d6efd; font-size: 24px; font-weight: 700; }}
                .content {{ padding: 30px; }}
                .stats-container {{ display: flex; flex-direction: column; gap: 15px; margin-top: 20px; }}
                .stat-box {{ background-color: #f8f9fa; border-radius: 6px; padding: 20px; border-left: 4px solid #0d6efd; }}
                .stat-box.success {{ border-left-color: #198754; }}
                .stat-box.info {{ border-left-color: #0dcaf0; }}
                .stat-title {{ font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #6c757d; font-weight: 600; margin-bottom: 5px; }}
                .stat-value {{ font-size: 28px; font-weight: 700; color: #212529; margin: 0; }}
                .footer {{ background-color: #f8f9fa; padding: 15px 30px; text-align: center; color: #6c757d; font-size: 13px; border-top: 1px solid #e9ecef; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Monthly Activity Report</h1>
                </div>
                <div class="content">
                    <p>Hello Admin,</p>
                    <p>Here is your institutional placement summary report for <strong>{month_name}</strong>.</p>
                    
                    <div class="stats-container">
                        <div class="stat-box">
                            <div class="stat-title">New Drives Conducted</div>
                            <div class="stat-value">{drives_conducted}</div>
                        </div>
                        <div class="stat-box info">
                            <div class="stat-title">Distinct Students Applied</div>
                            <div class="stat-value">{students_applied}</div>
                        </div>
                        <div class="stat-box success">
                            <div class="stat-title">Distinct Students Selected</div>
                            <div class="stat-value">{students_selected}</div>
                        </div>
                    </div>
                </div>
                <div class="footer">
                    &copy; {today.year} Placement Portal Application. Auto-generated on {today.strftime("%B %d, %Y")}.
                </div>
            </div>
        </body>
        </html>
        """
        
        admin = User.query.filter_by(role='admin').first()
        if admin:
            try:
                msg = MIMEMultipart('alternative')
                msg['Subject'] = f"Placement Portal - {month_name} Activity Report"
                msg['From'] = "agnihotrigaurav659@gmail.com"
                msg['To'] = "23f3001592@ds.study.iitm.ac.in"
                part = MIMEText(html_content, 'html')
                msg.attach(part)
                
                # Setup SMTP connection
                server_host = app.config.get('MAIL_SERVER', 'smtp.gmail.com')
                server_port = app.config.get('MAIL_PORT', 587)
                server = smtplib.SMTP(server_host, server_port)
                
                if app.config.get('MAIL_USE_TLS', True):
                    server.starttls()
    
                username = app.config.get('MAIL_USERNAME')
                password = app.config.get('MAIL_PASSWORD')
                if username and password:
                    server.login(username, password)
                    
                server.send_message(msg)
                server.quit()
                print(f"Monthly HTML report successfully sent via email to {admin.email}.")
            except Exception as e:
                print(f"Mail failed to send. MOCK Fallback HTML log: {html_content}")

celery_app.conf.beat_schedule = {
    'daily-reminders': {
        'task': 'tasks.daily_reminders',
        'schedule': crontab(hour=9, minute=0),
    },
    'monthly-report': {
        'task': 'tasks.monthly_activity_report',
        'schedule': crontab(day_of_month=1, hour=8, minute=0),
    }
}
celery_app.conf.timezone = 'UTC'
