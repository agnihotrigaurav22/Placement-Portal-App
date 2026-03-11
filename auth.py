from flask import Blueprint, request, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt
from models import db, User, StudentProfile, CompanyProfile

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    role = data.get('role')

    if not email or not password or not role:
        return jsonify({"msg": "Missing fields"}), 400

    if role not in ['student', 'company']:
        return jsonify({"msg": "Invalid role"}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"msg": "Email already exists"}), 400

    hashed_password = generate_password_hash(password, method='pbkdf2:sha256')
    new_user = User(email=email, password=hashed_password, role=role)
    
    db.session.add(new_user)
    db.session.commit()

    if role == 'student':
        name = data.get('name')
        branch = data.get('branch')
        cgpa = float(data.get('cgpa', 0.0))
        year_of_graduation = int(data.get('year_of_graduation', 0))
        
        student_profile = StudentProfile(
            user_id=new_user.id,
            name=name,
            branch=branch,
            cgpa=cgpa,
            year_of_graduation=year_of_graduation,
            resume_link=data.get('resume_link', '')
        )
        db.session.add(student_profile)
    elif role == 'company':
        company_name = data.get('company_name')
        hr_contact = data.get('hr_contact')
        website = data.get('website', '')
        
        company_profile = CompanyProfile(
            user_id=new_user.id,
            company_name=company_name,
            hr_contact=hr_contact,
            website=website,
            approval_status='Pending'
        )
        db.session.add(company_profile)

    db.session.commit()
    return jsonify({"msg": "User created successfully"}), 201

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')

    user = User.query.filter_by(email=email).first()
    if not user or not check_password_hash(user.password, password):
        return jsonify({"msg": "Bad email or password"}), 401

    if not user.active:
        return jsonify({"msg": "Account deactivated or blacklisted"}), 403
        
    if user.role == 'company' and user.company_profile.approval_status != 'Approved':
        return jsonify({"msg": "Company registration pending approval or blacklisted"}), 403

    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={'id': user.id, 'role': user.role, 'email': user.email}
    )
    
    user_name = "Admin"
    if user.role == 'student' and user.student_profile:
        user_name = user.student_profile.name
    elif user.role == 'company' and user.company_profile:
        user_name = user.company_profile.company_name
        
    return jsonify(access_token=access_token, role=user.role, name=user_name), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_me():
    current_user = get_jwt()
    user = User.query.get(current_user['id'])
    
    user_data = {
        'id': user.id,
        'email': user.email,
        'role': user.role,
        'active': user.active
    }
    
    if user.role == 'student' and user.student_profile:
        user_data['student_profile'] = {
            'id': user.student_profile.id,
            'name': user.student_profile.name,
            'branch': user.student_profile.branch,
            'cgpa': user.student_profile.cgpa,
            'year_of_graduation': user.student_profile.year_of_graduation,
            'resume_link': user.student_profile.resume_link
        }
    elif user.role == 'company' and user.company_profile:
        user_data['company_profile'] = {
            'id': user.company_profile.id,
            'company_name': user.company_profile.company_name,
            'hr_contact': user.company_profile.hr_contact,
            'website': user.company_profile.website,
            'approval_status': user.company_profile.approval_status
        }
        
    return jsonify(user_data), 200
