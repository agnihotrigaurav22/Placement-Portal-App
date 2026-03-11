import os
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from models import db, User, StudentProfile, CompanyProfile, PlacementDrive, Application
from datetime import datetime
from tasks import celery_app, export_applications_csv
from extensions import cache

api_bp = Blueprint('api', __name__)

#admin routes
@api_bp.route('/admin/dashboard', methods=['GET'])
@jwt_required()
@cache.cached(timeout=180, key_prefix='admin_dashboard')
def admin_dashboard():
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    total_students = db.session.query(StudentProfile).count()
    total_companies = db.session.query(CompanyProfile).count()
    total_drives = db.session.query(PlacementDrive).count()
    
    total_applications = db.session.query(Application).count()
    selected_students = db.session.query(Application).filter_by(status='Selected').count()
    shortlisted_students = db.session.query(Application).filter_by(status='Shortlisted').count()
    
    return jsonify({
        "total_students": total_students,
        "total_companies": total_companies,
        "total_drives": total_drives,
        "total_applications": total_applications,
        "selected_students": selected_students,
        "shortlisted_students": shortlisted_students
    }), 200

@api_bp.route('/admin/companies', methods=['GET'])
@jwt_required()
def admin_get_companies():
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    search = request.args.get('search', '').lower()
    companies = CompanyProfile.query.all()
    if search:
        companies = [c for c in companies if search in c.company_name.lower() or search in c.hr_contact.lower()]
    
    results = []
    for c in companies:
        results.append({
            "id": c.id,
            "company_name": c.company_name,
            "hr_contact": c.hr_contact,
            "website": c.website,
            "approval_status": c.approval_status,
            "active": c.user.active,
            "user_id": c.user_id
        })
    return jsonify(results), 200

@api_bp.route('/admin/companies/<int:company_id>/status', methods=['PUT'])
@jwt_required()
def update_company_status(company_id):
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    data = request.get_json()
    status = data.get('status')
    
    company = CompanyProfile.query.get(company_id)
    if not company:
        return jsonify({"msg": "Company not found"}), 404
        
    if status in ['Approved', 'Pending', 'Blacklisted']:
        company.approval_status = status
        db.session.commit()
        cache.clear()
        return jsonify({"msg": f"Company status updated to {status}"}), 200
    return jsonify({"msg": "Invalid status"}), 400

@api_bp.route('/admin/students', methods=['GET'])
@jwt_required()
def admin_get_students():
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    search = request.args.get('search', '').lower()
    students = StudentProfile.query.all()
    if search:
        students = [s for s in students if search in s.name.lower() or search in s.branch.lower()]
        
    results = []
    for s in students:
        results.append({
            "id": s.id,
            "name": s.name,
            "branch": s.branch,
            "cgpa": s.cgpa,
            "year_of_graduation": s.year_of_graduation,
            "user_id": s.user_id,
            "active": s.user.active
        })
    return jsonify(results), 200

@api_bp.route('/admin/users/<int:user_id>/active', methods=['PUT'])
@jwt_required()
def update_user_active(user_id):
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    data = request.get_json()
    user = User.query.get(user_id)
    if not user:
        return jsonify({"msg": "User not found"}), 404
        
    user.active = data.get('active', True)
    db.session.commit()
    cache.clear()
    return jsonify({"msg": "User active status updated"}), 200

@api_bp.route('/admin/drives', methods=['GET'])
@jwt_required()
def admin_get_drives():
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
        
    search = request.args.get('search', '').lower()
    drives = PlacementDrive.query.all()
    if search:
        drives = [d for d in drives if search in d.job_title.lower() or search in d.company.company_name.lower()]

    results = []
    for d in drives:
        results.append({
            "id": d.id,
            "company_name": d.company.company_name,
            "job_title": d.job_title,
            "status": d.status,
            "application_deadline": d.application_deadline.isoformat(),
            "min_cgpa": d.min_cgpa,
        })
    return jsonify(results), 200

@api_bp.route('/admin/drives/<int:drive_id>/status', methods=['PUT'])
@jwt_required()
def update_drive_status(drive_id):
    identity = get_jwt()
    if identity['role'] != 'admin':
        return jsonify({"msg": "Unauthorized"}), 403
    
    data = request.get_json()
    status = data.get('status')
    
    drive = PlacementDrive.query.get(drive_id)
    if not drive:
        return jsonify({"msg": "Drive not found"}), 404
        
    if status in ['Approved', 'Pending', 'Closed', 'Rejected']:
        drive.status = status
        db.session.commit()
        cache.clear()
        return jsonify({"msg": f"Drive status updated to {status}"}), 200
    return jsonify({"msg": "Invalid status"}), 400

#company routes
@api_bp.route('/company/drives', methods=['GET', 'POST'])
@jwt_required()
def company_drives():
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
    
    user = User.query.get(identity['id'])
    company = user.company_profile
    if not company or company.approval_status != 'Approved':
        return jsonify({"msg": "Company not approved"}), 403

    if request.method == 'GET':
        drives = PlacementDrive.query.filter_by(company_id=company.id).all()
        results = []
        for d in drives:
            results.append({
                "id": d.id,
                "job_title": d.job_title,
                "job_description": d.job_description,
                "branch_eligibility": d.branch_eligibility,
                "min_cgpa": d.min_cgpa,
                "year_eligibility": d.year_eligibility,
                "application_deadline": d.application_deadline.isoformat(),
                "status": d.status,
                "applicants_count": len(d.applications)
            })
        return jsonify(results), 200

    if request.method == 'POST':
        data = request.get_json()
        
        try:
            deadline = datetime.fromisoformat(data['application_deadline'].replace('Z', '+00:00'))
        except:
            deadline = datetime.utcnow()
            
        new_drive = PlacementDrive(
            company_id=company.id,
            job_title=data['job_title'],
            job_description=data['job_description'],
            branch_eligibility=data['branch_eligibility'],
            min_cgpa=float(data['min_cgpa']),
            year_eligibility=int(data['year_eligibility']),
            application_deadline=deadline,
            status='Pending' # Admins must approve
        )
        db.session.add(new_drive)
        db.session.commit()
        cache.clear()
        return jsonify({"msg": "Drive created and pending approval"}), 201

@api_bp.route('/company/drives/<int:drive_id>/applications', methods=['GET'])
@jwt_required()
def company_drive_applications(drive_id):
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    company = user.company_profile
    
    drive = PlacementDrive.query.filter_by(id=drive_id, company_id=company.id).first()
    if not drive:
        return jsonify({"msg": "Drive not found"}), 404
        
    applications = Application.query.filter_by(drive_id=drive_id).all()
    results = []
    for app in applications:
        results.append({
            "application_id": app.id,
            "student_name": app.student.name,
            "branch": app.student.branch,
            "cgpa": app.student.cgpa,
            "resume_link": app.student.resume_link,
            "application_date": app.application_date.isoformat(),
            "status": app.status,
            "interview_date": app.interview_date.isoformat() if app.interview_date else None,
            "interview_link": app.interview_link
        })
    return jsonify(results), 200

@api_bp.route('/company/applications/<int:app_id>/status', methods=['PUT'])
@jwt_required()
def company_update_app_status(app_id):
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
        
    data = request.get_json()
    status = data.get('status') # 'Applied', 'Shortlisted', 'Selected', 'Rejected'
    
    user = User.query.get(identity['id'])
    
    application = Application.query.get(app_id)
    if not application or application.drive.company_id != user.company_profile.id:
        return jsonify({"msg": "Application not found"}), 404
        
    application.status = status
    db.session.commit()
    cache.clear()
    return jsonify({"msg": f"Application status updated to {status}"}), 200

@api_bp.route('/company/applications/<int:app_id>/interview', methods=['PUT'])
@jwt_required()
def company_schedule_interview(app_id):
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
        
    data = request.get_json()
    interview_date = data.get('interview_date')
    interview_link = data.get('interview_link')
    
    user = User.query.get(identity['id'])
    application = Application.query.get(app_id)
    if not application or application.drive.company_id != user.company_profile.id:
        return jsonify({"msg": "Application not found"}), 404
        
    if interview_date:
        try:
            # Parse datetime ignoring timezone info
            application.interview_date = datetime.fromisoformat(interview_date.replace('Z', '+00:00'))
        except ValueError:
            return jsonify({"msg": "Invalid date format"}), 400
    if interview_link is not None:
        application.interview_link = interview_link
        
    db.session.commit()
    return jsonify({"msg": "Interview scheduled successfully"}), 200

#student routes
@api_bp.route('/student/profile', methods=['PUT'])
@jwt_required()
def student_update_profile():
    identity = get_jwt()
    if identity['role'] != 'student':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    student = user.student_profile
    data = request.get_json()
    
    student.name = data.get('name', student.name)
    student.branch = data.get('branch', student.branch)
    if 'cgpa' in data:
        student.cgpa = float(data.get('cgpa'))
    if 'year_of_graduation' in data:
        student.year_of_graduation = int(data.get('year_of_graduation'))
    student.resume_link = data.get('resume_link', student.resume_link)
    
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully"}), 200

@api_bp.route('/company/profile', methods=['PUT'])
@jwt_required()
def company_update_profile():
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    company = user.company_profile
    data = request.get_json()
    
    company.company_name = data.get('company_name', company.company_name)
    company.hr_contact = data.get('hr_contact', company.hr_contact)
    company.website = data.get('website', company.website)
    
    db.session.commit()
    return jsonify({"msg": "Profile updated successfully"}), 200
@api_bp.route('/student/drives', methods=['GET'])
@jwt_required()
def student_drives():
    identity = get_jwt()
    if identity['role'] != 'student':
        return jsonify({"msg": "Unauthorized"}), 403
        
    search = request.args.get('search', '').lower()
    user = User.query.get(identity['id'])
    student = user.student_profile
    
    drives = PlacementDrive.query.filter_by(status='Approved').all()
    if search:
        drives = [d for d in drives if search in d.job_title.lower() or search in d.company.company_name.lower()]
        
    results = []
    for d in drives:
        # Check if already applied
        applied = any(app.student_id == student.id for app in d.applications)
        
        # Check eligibility loosely
        eligible = True
        if student.cgpa < d.min_cgpa:
            eligible = False
        if student.year_of_graduation != d.year_eligibility:
            eligible = False
            
        branches = [b.strip().lower() for b in d.branch_eligibility.split(',')]
        if student.branch.lower() not in branches and 'any' not in branches:
            eligible = False
            
        results.append({
            "id": d.id,
            "company_name": d.company.company_name,
            "job_title": d.job_title,
            "job_description": d.job_description,
            "branch_eligibility": d.branch_eligibility,
            "min_cgpa": d.min_cgpa,
            "year_eligibility": d.year_eligibility,
            "application_deadline": d.application_deadline.isoformat(),
            "eligible": eligible,
            "applied": applied
        })
    return jsonify(results), 200

@api_bp.route('/student/drives/<int:drive_id>/apply', methods=['POST'])
@jwt_required()
def student_apply(drive_id):
    identity = get_jwt()
    if identity['role'] != 'student':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    student = user.student_profile
    
    drive = PlacementDrive.query.get(drive_id)
    if not drive or drive.status != 'Approved':
        return jsonify({"msg": "Drive not available"}), 404
        
    # check double apply
    existing_app = Application.query.filter_by(student_id=student.id, drive_id=drive_id).first()
    if existing_app:
        return jsonify({"msg": "Already applied"}), 400
        
    # Check deadline
    if datetime.utcnow() > drive.application_deadline:
        return jsonify({"msg": "Application deadline passed"}), 400
        
    # Strict Eligibility Check
    if student.cgpa < drive.min_cgpa:
         return jsonify({"msg": f"Strict Eligibility Failed: Minimum CGPA of {drive.min_cgpa} Required."}), 400
         
    if student.year_of_graduation != drive.year_eligibility:
         return jsonify({"msg": f"Strict Eligibility Failed: Only graduation year {drive.year_eligibility} is eligible."}), 400
         
    branches = [b.strip().lower() for b in drive.branch_eligibility.split(',')]
    if student.branch.lower() not in branches and 'any' not in branches:
         return jsonify({"msg": f"Strict Eligibility Failed: Branch '{student.branch}' is not eligible for this drive."}), 400
         
    new_app = Application(
        student_id=student.id,
        drive_id=drive_id,
        status='Applied'
    )
    db.session.add(new_app)
    db.session.commit()
    cache.clear()
    return jsonify({"msg": "Applied successfully"}), 201

@api_bp.route('/student/applications', methods=['GET'])
@jwt_required()
def student_applications():
    identity = get_jwt()
    if identity['role'] != 'student':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    student = user.student_profile
    
    applications = Application.query.filter_by(student_id=student.id).all()
    results = []
    for app in applications:
        results.append({
            "id": app.id,
            "company_name": app.drive.company.company_name,
            "job_title": app.drive.job_title,
            "application_date": app.application_date.isoformat(),
            "status": app.status,
            "interview_date": app.interview_date.isoformat() if app.interview_date else None,
            "interview_link": app.interview_link
        })
    return jsonify(results), 200

@api_bp.route('/student/export-csv', methods=['POST'])
@jwt_required()
def export_csv_job():
    identity = get_jwt()
    if identity['role'] != 'student':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    student = user.student_profile
    
    task = export_applications_csv.delay(student.id)
    return jsonify({"msg": "Export task triggered", "task_id": task.id}), 202

@api_bp.route('/task-status/<task_id>', methods=['GET'])
def get_task_status(task_id):
    task = export_applications_csv.AsyncResult(task_id)
    if task.state == 'PENDING':
        return jsonify({"state": task.state, "status": "Pending..."})
    elif task.state != 'FAILURE':
        return jsonify({"state": task.state, "result": task.result}) # the filepath
    else:
        return jsonify({"state": task.state, "status": str(task.info)}), 200

@api_bp.route('/company/applications/<int:app_id>/offer', methods=['POST'])
@jwt_required()
def generate_offer_letter(app_id):
    identity = get_jwt()
    if identity['role'] != 'company':
        return jsonify({"msg": "Unauthorized"}), 403
        
    user = User.query.get(identity['id'])
    application = Application.query.get(app_id)
    
    if not application or application.drive.company_id != user.company_profile.id:
        return jsonify({"msg": "Application not found"}), 404
        
    if application.status != 'Selected':
        return jsonify({"msg": "Offer letters can only be generated for Selected candidates."}), 400

    data = request.get_json()
    salary = data.get('salary', 'TBD')
    joining_date = data.get('joining_date', 'TBD')
    
    offer_content = f"""
    OFFER LETTER
    
    Dear {application.student.name},
    
    Congratulations! We are pleased to offer you the position of {application.drive.job_title} at {user.company_profile.company_name}.
    We were very impressed with your background and interview performance.
    
    Details of your offer:
    - Base Salary: {salary}
    - Expected Joining Date: {joining_date}
    
    Please sign and return this offer to acknowledge your acceptance.
    
    Best regards,
    HR Team, {user.company_profile.company_name}
    """
    
    return jsonify({"msg": "Offer letter generated", "letter": offer_content}), 200
