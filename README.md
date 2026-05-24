# Placement Portal Application

![Python](https://img.shields.io/badge/Python-3.10+-blue)
![Flask](https://img.shields.io/badge/Flask-Backend-black)
![Vue.js](https://img.shields.io/badge/Vue.js-CDN-green)
![SQLite](https://img.shields.io/badge/SQLite-Database-blue)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![Celery](https://img.shields.io/badge/Celery-Background%20Tasks-green)
![JWT](https://img.shields.io/badge/JWT-Authentication-orange)

A comprehensive Placement Management System designed to streamline campus recruitment by connecting **Students**, **Companies**, and **Administrators** on a single platform. The system automates placement workflows, eligibility verification, application tracking, interview scheduling, offer generation, reporting, and email notifications.

---

## 📖 Overview

The Placement Portal Application provides an end-to-end solution for campus recruitment management.

The platform enables:

- Student registration and profile management
- Company onboarding and recruitment drive creation
- Placement drive approval workflow
- Eligibility-based application system
- Applicant tracking and interview scheduling
- Offer letter generation
- Automated reminders and reports
- Background task processing using Celery and Redis
- Secure JWT-based authentication

---

## ✨ Features

### 🎓 Student Features

- User registration and login
- JWT-based authentication
- Academic profile management
- Resume link management
- Browse approved placement drives
- Apply to eligible drives
- Automatic eligibility verification
- Application status tracking
- Interview schedule monitoring
- CSV export of application history

---

### 🏢 Company Features

- Company registration and profile management
- Create and manage placement drives
- Define eligibility criteria
- View student applications
- Shortlist, reject, or select candidates
- Schedule interviews
- Share interview meeting links
- Generate offer letters for selected candidates

---

### 👨‍💼 Admin Features

- Company approval and verification
- Placement drive approval workflow
- Student account management
- User activation/deactivation
- Dashboard with system-wide statistics
- Application and placement monitoring
- Cached analytics using Redis

---

### ⚙️ Automated Features

#### Daily Email Reminders

- Students receive notifications for placement drives closing within the next 3 days.

#### Monthly Placement Reports

- Automated reports sent to administrators containing:
  - New drives created
  - Total applications
  - Unique applicants
  - Successful hires

#### Background CSV Export

- Heavy export operations processed asynchronously using Celery.

#### Dashboard Caching

- Redis caching reduces database load and improves dashboard performance.

---

## 🏗️ System Architecture

The application follows a Three-Tier Architecture.

### 1️⃣ Presentation Layer

- Vue.js (CDN)
- Bootstrap
- HTML5
- CSS3
- Axios

Responsible for rendering UI and communicating with backend APIs.

### 2️⃣ Business Logic Layer

- Flask
- JWT Authentication
- RESTful APIs

Handles authentication, authorization, eligibility checks, and application workflows.

### 3️⃣ Data & Worker Layer

- SQLite
- SQLAlchemy
- Redis
- Celery
- Celery Beat

Responsible for data persistence, caching, and background task execution.

---

## 🛠️ Tech Stack

### Backend

- Flask
- SQLAlchemy
- Flask-JWT-Extended
- Flask-Caching

### Frontend

- Vue.js (CDN)
- Bootstrap
- Axios
- HTML5
- CSS3

### Database

- SQLite

### Background Processing

- Celery
- Redis
- Celery Beat

### Email Service

- Python SMTP (Google SMTP)

---

## 📂 Project Structure

```text
placement-portal/
│
├── static/
│   ├── app.js
│   └── style.css
│
├── templates/
│   └── index.html
│
├── app.py
├── auth.py
├── routes.py
├── models.py
├── tasks.py
├── extensions.py
├── config.py
├── run.py
├── start.sh
│
├── README.md
└── Project_Report.md
```

---

## 🔐 Authentication & Authorization

The application uses **JWT (JSON Web Tokens)** for secure authentication and role-based access control.

### Supported Roles

- Admin
- Student
- Company

### Authentication Flow

1. User logs in.
2. Backend generates JWT token.
3. Token is stored on the frontend.
4. Protected API requests include JWT token.
5. Backend validates user role and permissions.

---

## 📡 API Endpoints

### Authentication APIs

| Method | Endpoint | Description |
|----------|------------|-------------|
| POST | `/api/auth/register` | Register Student or Company |
| POST | `/api/auth/login` | User Login |

---

### Student APIs

| Method | Endpoint |
|----------|------------|
| PUT | `/api/student/profile` |
| GET | `/api/student/drives` |
| POST | `/api/student/drives/<id>/apply` |
| GET | `/api/student/applications` |
| POST | `/api/student/export-csv` |
| GET | `/api/task-status/<id>` |

---

### Company APIs

| Method | Endpoint |
|----------|------------|
| PUT | `/api/company/profile` |
| GET | `/api/company/drives` |
| POST | `/api/company/drives` |
| GET | `/api/company/drives/<id>/applications` |
| PUT | `/api/company/applications/<id>/status` |
| PUT | `/api/company/applications/<id>/interview` |
| POST | `/api/company/applications/<id>/offer` |

---

### Admin APIs

| Method | Endpoint |
|----------|------------|
| GET | `/api/admin/dashboard` |
| GET | `/api/admin/companies` |
| PUT | `/api/admin/companies/<id>/status` |
| GET | `/api/admin/students` |
| PUT | `/api/admin/users/<id>/active` |
| GET | `/api/admin/drives` |
| PUT | `/api/admin/drives/<id>/status` |

---

## 🎯 Eligibility Verification System

Before a student can apply to a placement drive, the system automatically verifies:

- Minimum CGPA requirement
- Eligible branches
- Graduation year criteria

Applications are allowed only if all conditions are satisfied.

---

## 📧 Automated Workflow

### Daily Placement Alerts

Every day, the system identifies drives closing within the next 3 days and sends reminder emails to students.

### Monthly Placement Reports

On the 1st of every month, the system generates:

- Number of new drives
- Total applications
- Unique applicants
- Successful hires

The report is automatically emailed to the administrator.

---

## ⚡ Performance Optimizations

### Redis Caching

Admin dashboard metrics are cached to reduce repeated database queries.

### Celery Workers

Long-running operations are processed in the background:

- CSV exports
- Email notifications
- Monthly report generation

This keeps API response times fast.

---

## 🚀 Installation & Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/placement-portal.git

cd placement-portal
```

---

### 2. Create Virtual Environment

#### Windows

```bash
python -m venv venv

venv\Scripts\activate
```

#### Linux / Mac

```bash
python3 -m venv venv

source venv/bin/activate
```

---

### 3. Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. Configure Environment Variables

Create a `.env` file:

```env
SECRET_KEY=your_secret_key

JWT_SECRET_KEY=your_jwt_secret

MAIL_USERNAME=your_email@gmail.com

MAIL_PASSWORD=your_app_password

REDIS_URL=redis://localhost:6379/0
```

---

### 5. Start Redis Server

#### Linux / Mac

```bash
redis-server
```

#### Windows

Start Redis service or run:

```bash
redis-server.exe
```

---

### 6. Initialize Database

```bash
python run.py
```

The SQLite database will be created automatically.

---

### 7. Start Celery Worker

```bash
celery -A tasks.celery worker --loglevel=info
```

---

### 8. Start Celery Beat Scheduler

```bash
celery -A tasks.celery beat --loglevel=info
```

---

### 9. Run Flask Application

```bash
python run.py
```

Application will be available at:

```text
http://localhost:5000
```

---

## 🌐 Frontend Setup

This project uses **Vue.js via CDN**, therefore:

✅ No Node.js required

✅ No npm install required

✅ No Vue CLI required

✅ No Vite required

Vue is loaded directly in `templates/index.html`.

Frontend files:

```text
templates/index.html
static/app.js
static/style.css
```
---

## 🔮 Future Enhancements

- Resume Parsing using AI
- Real-time Notifications
- Interview Feedback Module
- Advanced Placement Analytics
- Multi-Institute Support
- Cloud Deployment (AWS/GCP/Azure)
- Mobile Application
