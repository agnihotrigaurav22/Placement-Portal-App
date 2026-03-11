# Placement Portal Application - Project Report

**Author:**  
Gaurav Agnihotri  
23f3001592  
23f3001592@ds.study.iitm.ac.in

**About:**  
Myself Gaurav Agnihotri, I’m a student and learner with a passion for Computer Science and building robust software. My interests span across backend development, data science, and emerging cloud technologies. I’m deeply passionate about learning new technical frameworks and building secure, data-driven web solutions that solve real-world problems.

**AI/LLM Usage:**  
I utilized AI tools (such as Claude and Gemini) during the development of this project to assist me in setting up foundational frontend layouts (10%), diagnosing complex debugging errors particularly with background task routing (15%), and structuring RESTful API communication paradigms (15%). The AI mainly guided me through understanding certain complex parts of the architecture and improving my development workflow. All the code, logic, and suggestions generated through AI were rigorously reviewed, modified, and tested by me to perfectly fit the project's requirements.

**Description:**  
To build and deploy a comprehensive **Placement Portal Application** that streamlines campus recruitment operations. The platform facilitates a seamless connection between Students, Hiring Companies, and Institute Administrators, handling everything from company verifications and placement drive creation to strict applicant eligibility tracking and automated communication.

**Technology Used:**  
- **Backend:** Flask (Python)
- **Frontend:** Vue.js (HTML/CSS/JS)
- **Database:** SQLite (via SQLAlchemy)
- **Asynchronous Tasks:** Celery + Redis
- **Email & Background Jobs:** Python smtplib (Google SMTP) + Celery Beat
- **Caching & Performance:** Flask-Caching (Redis)
- **API Communication:** Axios

---

### API Design:

#### 1. Authentication APIs
| Method | Endpoint | Description | Access |
|---|---|---|---|
| POST | `/api/auth/register` | User registration (Student/Company) | Public |
| POST | `/api/auth/login` | User authentication and JWT assignment | Public |

#### 2. Admin APIs
| Method | Endpoint | Description | Access |
|---|---|---|---|
| GET | `/api/admin/dashboard` | System statistics (Students, Companies, Drives) | Admin |
| GET | `/api/admin/companies` | List all companies | Admin |
| PUT | `/api/admin/companies/<id>/status` | Approve, Reject, or Blacklist companies | Admin |
| GET | `/api/admin/students` | List all registered students | Admin |
| PUT | `/api/admin/users/<id>/active` | Activate or Deactivate system users | Admin |
| GET | `/api/admin/drives` | Monitor all placement drives | Admin |
| PUT | `/api/admin/drives/<id>/status` | Approve or Reject placement drives | Admin |

#### 3. Company APIs
| Method | Endpoint | Description | Access |
|---|---|---|---|
| PUT | `/api/company/profile` | Update company profile details | Company |
| GET | `/api/company/drives` | Fetch all drives created by the company | Company |
| POST | `/api/company/drives` | Create a new placement drive | Company |
| GET | `/api/company/drives/<id>/applications` | View students who applied to a specific drive | Company |
| PUT | `/api/company/applications/<id>/status` | Update student status (Shortlisted, Selected, Rejected)| Company |
| PUT | `/api/company/applications/<id>/interview` | Schedule interview dates and links | Company |
| POST | `/api/company/applications/<id>/offer` | Generate automated offer letters | Company |

#### 4. Student APIs
| Method | Endpoint | Description | Access |
|---|---|---|---|
| PUT | `/api/student/profile` | Update student academic profile | Student |
| GET | `/api/student/drives` | View approved active placement drives | Student |
| POST | `/api/student/drives/<id>/apply` | Apply to a placement drive (with eligibility check) | Student |
| GET | `/api/student/applications` | View applied drives and interview status | Student |
| POST | `/api/student/export-csv` | Trigger background job to export application history | Student |
| GET | `/api/task-status/<id>` | Poll task status of CSV generation | Student |

---

### Architecture:
The Placement Portal Application follows a strict **Three-Tier Architecture**:
1. **Presentation Layer (Frontend):** Vue.js components and Bootstrap UI handling user interactions dynamically.
2. **Logic Layer (Backend API):** Flask providing secure, JWT-authenticated RESTful API endpoints, strict eligibility logic, and route handling.
3. **Data & Worker Layer:** SQLite for persistent relational data storage alongside Redis and Celery for asynchronous background job scheduling and system caching.

---

### Features:

#### Student Features
- User registration and JWT-based authentication
- Comprehensive profile management (Branch, CGPA, graduation year, resume links)
- Browse available and approved placement drives
- **Strict Eligibility System:** System auto-verifies CGPA, branch, and graduation year before permitting applications
- Real-time application tracking and interview schedule monitoring
- Trigger offline CSV exports of personal application history

#### Company Features
- Dedicated company dashboard with profile management
- Create customized Placement Drives with specific eligibility thresholds (min CGPA, target branches)
- Interactively view detailed academic profiles of applicants 
- Manage applicant pipelines (mark as Applied, Shortlisted, Selected, or Rejected)
- Schedule candidate interviews and distribute meeting links within the portal
- Dynamically generate custom Offer Letters for selected candidates

#### Admin Features
- Comprehensive, Redis-cached admin dashboard displaying live system statistics
- Security gatekeeping (Approve/Reject new Company registrations)
- Review and Approve/Reject newly created Placement Drives before students can see them
- Global oversight of all registered Students, with the capability to deactivate fraudulent/dormant accounts
- Oversee overall application conversion metrics (Shortlisted/Selected counts)

#### Automated Features (Celery + Redis)
- **Daily Reminders:** Scheduled background cron job executing every day to securely BCC email students regarding Placement Drives closing within the next 3 days.
- **Monthly Reports:** Automated generation of HTML summary reports outlining the previous month's placement activity (new drives, unique student applications, and distinct successful hires), directly emailed to the Admin on the 1st of every month.
- **Background Exports:** Asynchronous generation of CSV data files offloading heavy data parsing from the web server.
- **High-Performance Caching:** Redis caching on the Admin dashboard to drastically reduce database overhead and speed up metrics delivery.
