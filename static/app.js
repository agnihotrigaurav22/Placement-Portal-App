const { createApp, ref, reactive, onMounted, computed } = Vue;
const { createRouter, createWebHistory } = VueRouter;

// Make axios use authorization header globally if token exists
axios.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Components
const Home = {
    template: `
    <div class="container py-xl-5 py-4">
        <div class="row align-items-center mb-5">
            <div class="col-lg-6 text-center text-lg-start mb-4 mb-lg-0">
                <h1 class="display-4 fw-bolder text-dark mb-3">Empower Your <span class="text-primary">Campus Placements</span></h1>
                <p class="lead text-muted mb-4">A streamlined platform to efficiently manage recruitment activities, bridging the gap between universities, talented students, and top tech companies.</p>
                <div class="d-grid gap-2 d-md-flex justify-content-md-start">
                    <router-link to="/register" class="btn btn-primary btn-lg px-4 me-md-2 shadow-sm">Get Started</router-link>
                    <router-link to="/login" class="btn btn-outline-secondary btn-lg px-4">Sign In</router-link>
                </div>
            </div>
            <div class="col-lg-6">
                <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" alt="Students Collaborative Working" class="img-fluid rounded-4 shadow-lg hero-img-hover" style="object-fit: cover;">
            </div>
        </div>
        
        <div class="row mt-5 pt-4 text-center">
            <div class="col-md-4 mb-4">
                <div class="p-4 border rounded-4 bg-white shadow-sm h-100 feature-card">
                    <h3 class="h5 text-primary fw-bold mt-2">For Students</h3>
                    <p class="text-muted small mt-3">Build a comprehensive branch profile, reliably explore approved placement drives, and track your interview schedules efficiently all in one place.</p>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="p-4 border rounded-4 bg-white shadow-sm h-100 feature-card">
                    <h3 class="h5 text-primary fw-bold mt-2">For Companies</h3>
                    <p class="text-muted small mt-3">Post detailed placement drives, seamlessly review student applications securely, issue offer letters directly, and recruit top university talent.</p>
                </div>
            </div>
            <div class="col-md-4 mb-4">
                <div class="p-4 border rounded-4 bg-white shadow-sm h-100 feature-card">
                    <h3 class="h5 text-primary fw-bold mt-2">For Institutes</h3>
                    <p class="text-muted small mt-3">Maintain administrative control over the entire campus recruitment cycle. Approve or blacklist companies, and automatically generate placement activity reports.</p>
                </div>
            </div>
        </div>
    </div>
`};

const Login = {
    template: `
        <div class="row justify-content-center">
            <div class="col-md-6">
                <div class="card p-4">
                    <h3 class="text-center mb-4 text-primary">Login</h3>
                    <div v-if="error" class="alert alert-danger">{{ error }}</div>
                    <form @submit.prevent="login">
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input v-model="email" type="email" class="form-control border-dark" required>
                        </div>
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input v-model="password" type="password" class="form-control border-dark" required>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 fw-bold">Login</button>
                    </form>
                    <div class="mt-3 text-center">
                        <small>Don't have an account? <router-link to="/register" class="text-decoration-none fw-bold text-primary">Register here</router-link></small>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const email = ref('');
        const password = ref('');
        const error = ref('');

        const login = async () => {
            try {
                const res = await axios.post('/api/auth/login', { email: email.value, password: password.value });
                localStorage.setItem('token', res.data.access_token);
                localStorage.setItem('role', res.data.role);
                localStorage.setItem('name', res.data.name);
                window.location.href = `/${res.data.role}/dashboard`;
            } catch (err) {
                error.value = err.response?.data?.msg || 'Login failed';
            }
        };

        return { email, password, error, login };
    }
};

const Register = {
    template: `
        <div class="row justify-content-center">
            <div class="col-md-8">
                <div class="card p-4 border-0 shadow-lg">
                    <h3 class="text-center mb-4 text-primary">Register</h3>
                    <div v-if="error" class="alert alert-danger">{{ error }}</div>
                    <div v-if="success" class="alert alert-success">{{ success }}</div>
                    
                    <form @submit.prevent="register">
                        <div class="mb-3">
                            <label class="form-label d-block">Role</label>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" v-model="form.role" value="student" id="roleStudent">
                                <label class="form-check-label" for="roleStudent">Student</label>
                            </div>
                            <div class="form-check form-check-inline">
                                <input class="form-check-input" type="radio" v-model="form.role" value="company" id="roleCompany">
                                <label class="form-check-label" for="roleCompany">Company</label>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Email</label>
                            <input v-model="form.email" type="email" class="form-control border-dark" required>
                        </div>
                        
                        <div class="mb-3">
                            <label class="form-label">Password</label>
                            <input v-model="form.password" type="password" class="form-control border-dark" required>
                        </div>

                        <!-- Student Fields -->
                        <div v-if="form.role === 'student'">
                            <div class="mb-3">
                                <label class="form-label">Full Name</label>
                                <input v-model="form.name" type="text" class="form-control border-dark" required>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label class="form-label">Branch</label>
                                    <input v-model="form.branch" type="text" class="form-control border-dark" required>
                                </div>
                                <div class="col">
                                    <label class="form-label">CGPA</label>
                                    <input v-model="form.cgpa" type="number" step="0.01" max="10" class="form-control border-dark" required>
                                </div>
                            </div>
                            <div class="row mb-3">
                                <div class="col">
                                    <label class="form-label">Graduation Year</label>
                                    <input v-model="form.year_of_graduation" type="number" class="form-control border-dark" required>
                                </div>
                                <div class="col">
                                    <label class="form-label">Resume Link</label>
                                    <input v-model="form.resume_link" type="url" class="form-control border-dark">
                                </div>
                            </div>
                        </div>

                        <!-- Company Fields -->
                        <div v-if="form.role === 'company'">
                            <div class="mb-3">
                                <label class="form-label">Company Name</label>
                                <input v-model="form.company_name" type="text" class="form-control border-dark" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">HR Contact Email / Phone</label>
                                <input v-model="form.hr_contact" type="text" class="form-control border-dark" required>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Website</label>
                                <input v-model="form.website" type="url" class="form-control border-dark">
                            </div>
                        </div>

                        <button type="submit" class="btn btn-primary w-100 fw-bold">Register</button>
                    </form>
                    <div class="mt-3 text-center">
                        <small>Already have an account? <router-link to="/login" class="text-decoration-none fw-bold text-primary">Login here</router-link></small>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const form = reactive({
            role: 'student', email: '', password: '',
            name: '', branch: '', cgpa: '', year_of_graduation: '', resume_link: '',
            company_name: '', hr_contact: '', website: ''
        });
        const error = ref('');
        const success = ref('');

        const register = async () => {
            error.value = ''; success.value = '';
            try {
                const res = await axios.post('/api/auth/register', form);
                success.value = "Registration successful! Please login.";
            } catch (err) {
                error.value = err.response?.data?.msg || 'Registration failed';
            }
        };

        return { form, error, success, register };
    }
};

// --- admin components ---
const AdminDashboard = {
    template: `
        <div>
            <h2 class="mb-4 text-dark font-weight-bold">Admin Dashboard</h2>
            <div class="row mt-4">
                <div class="col-md-4 mb-3">
                    <div class="card bg-primary text-white h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold">Total Students</h5>
                            <p class="card-text display-5 fw-bold mb-0 mt-2">{{ stats.total_students }}</p>
                            <router-link to="/admin/students" class="stretched-link"></router-link>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card bg-success text-white h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold">Total Companies</h5>
                            <p class="card-text display-5 fw-bold mb-0 mt-2">{{ stats.total_companies }}</p>
                            <router-link to="/admin/companies" class="stretched-link"></router-link>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card bg-warning text-white h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold text-dark">Total Drives</h5>
                            <p class="card-text display-5 fw-bold mb-0 mt-2 text-dark">{{ stats.total_drives }}</p>
                             <router-link to="/admin/drives" class="stretched-link"></router-link>
                        </div>
                    </div>
                </div>
            </div>

            <h3 class="mt-5 border-bottom pb-2 fw-bold text-secondary">Placement Statistics & Reports</h3>
            <div class="row mt-4">
                <div class="col-md-4 mb-3">
                    <div class="card bg-info text-white h-100 shadow-sm border-0 feature-card">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold">Total Applications</h5>
                            <p class="card-text display-5 fw-bold mb-0 mt-2">{{ stats.total_applications }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card bg-dark text-white h-100 shadow-sm border-0 feature-card">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold text-light">Students Shortlisted</h5>
                            <p class="card-text display-5 fw-bold text-warning mb-0 mt-2">{{ stats.shortlisted_students }}</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4 mb-3">
                    <div class="card text-white h-100 shadow-sm border-0 feature-card" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%);">
                        <div class="card-body text-center p-4">
                            <h5 class="card-title fw-bold text-light">Students Selected</h5>
                            <p class="card-text display-5 fw-bold text-white mb-0 mt-2">{{ stats.selected_students }}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const stats = ref({ total_students: 0, total_companies: 0, total_drives: 0, total_applications: 0, shortlisted_students: 0, selected_students: 0 });
        onMounted(async () => {
            const res = await axios.get('/api/admin/dashboard');
            stats.value = res.data;
        });
        return { stats };
    }
};

const AdminCompanies = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">Manage Companies</h2>
                <router-link to="/admin/dashboard" class="btn btn-outline-secondary fw-bold">← Back to Dashboard</router-link>
            </div>
            <div class="mb-3 w-50">
                <input type="text" class="form-control border-dark" placeholder="Search companies..." v-model="searchQuery" @input="load">
            </div>
            <table class="table table-bordered table-striped mt-3">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Website</th>
                        <th>HR Contact</th>
                        <th>Status</th>
                        <th>Active</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="c in companies" :key="c.id">
                        <td>{{ c.id }}</td>
                        <td>{{ c.company_name }}</td>
                        <td>{{ c.website }}</td>
                        <td>{{ c.hr_contact }}</td>
                        <td>
                            <span class="badge" :class="{'bg-warning': c.approval_status==='Pending', 'bg-success': c.approval_status==='Approved', 'bg-danger': c.approval_status==='Blacklisted'}">
                                {{ c.approval_status }}
                            </span>
                        </td>
                        <td>{{ c.active ? 'Yes' : 'No' }}</td>
                        <td>
                            <select class="form-select form-select-sm d-inline w-auto me-2" @change="updateStatus(c.id, $event.target.value)">
                                <option disabled selected>Change Status</option>
                                <option value="Approved">Approve</option>
                                <option value="Pending">Pending</option>
                                <option value="Blacklisted">Blacklist</option>
                            </select>
                            <button class="btn btn-sm" :class="c.active ? 'btn-outline-danger' : 'btn-outline-success'" @click="toggleActive(c.user_id, c.active)">
                                {{ c.active ? 'Deactivate' : 'Activate' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        const companies = ref([]);
        const searchQuery = ref('');
        const load = async () => {
            const res = await axios.get('/api/admin/companies', { params: { search: searchQuery.value } });
            companies.value = res.data;
        };
        onMounted(load);

        const updateStatus = async (id, status) => {
            await axios.put(`/api/admin/companies/${id}/status`, { status });
            load();
        };

        const toggleActive = async (userId, current) => {
            await axios.put(`/api/admin/users/${userId}/active`, { active: !current });
            load();
        };

        return { companies, updateStatus, toggleActive, searchQuery, load };
    }
};

const AdminStudents = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">Manage Students</h2>
                <router-link to="/admin/dashboard" class="btn btn-outline-secondary fw-bold">← Back to Dashboard</router-link>
            </div>
            <div class="mb-3 w-50">
                <input type="text" class="form-control border-dark" placeholder="Search students..." v-model="searchQuery" @input="load">
            </div>
            <table class="table table-bordered table-striped mt-3">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Name</th>
                        <th>Branch</th>
                        <th>CGPA</th>
                        <th>Graduation</th>
                        <th>Active</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="s in students" :key="s.id">
                        <td>{{ s.id }}</td>
                        <td>{{ s.name }}</td>
                        <td>{{ s.branch }}</td>
                        <td>{{ s.cgpa }}</td>
                        <td>{{ s.year_of_graduation }}</td>
                        <td>{{ s.active ? 'Yes' : 'No' }}</td>
                        <td>
                            <button class="btn btn-sm" :class="s.active ? 'btn-outline-danger' : 'btn-outline-success'" @click="toggleActive(s.user_id, s.active)">
                                {{ s.active ? 'Deactivate' : 'Activate' }}
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        const students = ref([]);
        const searchQuery = ref('');
        const load = async () => {
            const res = await axios.get('/api/admin/students', { params: { search: searchQuery.value } });
            students.value = res.data;
        };
        onMounted(load);

        const toggleActive = async (userId, current) => {
            await axios.put(`/api/admin/users/${userId}/active`, { active: !current });
            load();
        };

        return { students, toggleActive, searchQuery, load };
    }
};

const AdminDrives = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">Manage Placement Drives</h2>
                <router-link to="/admin/dashboard" class="btn btn-outline-secondary fw-bold">← Back to Dashboard</router-link>
            </div>
            <div class="mb-3 mt-3 w-50">
                <input type="text" class="form-control border-dark" placeholder="Search drives by name or company..." v-model="searchQuery" @input="load">
            </div>
            <table class="table table-bordered table-striped mt-3">
                <thead class="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td>{{ d.id }}</td>
                        <td>{{ d.company_name }}</td>
                        <td>{{ d.job_title }}</td>
                        <td>{{ new Date(d.application_deadline).toLocaleString() }}</td>
                        <td>
                            <span class="badge" :class="{'bg-warning': d.status==='Pending', 'bg-success': d.status==='Approved', 'bg-secondary': d.status==='Closed', 'bg-danger': d.status==='Rejected'}">
                                {{ d.status }}
                            </span>
                        </td>
                        <td>
                            <select class="form-select form-select-sm d-inline w-auto" @change="updateStatus(d.id, $event.target.value)">
                                <option disabled selected>Change Status</option>
                                <option value="Approved">Approve</option>
                                <option value="Pending">Pending</option>
                                <option value="Closed">Close</option>
                                <option value="Rejected">Reject</option>
                            </select>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        const drives = ref([]);
        const searchQuery = ref('');
        const load = async () => {
            const res = await axios.get('/api/admin/drives', { params: { search: searchQuery.value } });
            drives.value = res.data;
        };
        onMounted(load);

        const updateStatus = async (id, status) => {
            await axios.put(`/api/admin/drives/${id}/status`, { status });
            load();
        };

        return { drives, updateStatus, searchQuery, load };
    }
};

// --- student components ---
const StudentDashboard = {
    template: `
        <div>
            <h2 class="mb-4 text-dark font-weight-bold">Student Dashboard</h2>
            <div class="row mt-4">
                <div class="col-md-4 mb-4">
                   <div class="card h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold mb-3"><router-link to="/student/drives" class="text-primary text-decoration-none stretched-link">View Approved Placement Drives</router-link></h5>
                            <p class="card-text text-muted small">Check and apply for upcoming placement drives by top tech companies.</p>
                        </div>
                   </div>
                </div>
                <div class="col-md-4 mb-4">
                   <div class="card h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold mb-3"><router-link to="/student/applications" class="text-info text-decoration-none stretched-link">View Placement History</router-link></h5>
                            <p class="card-text text-muted small">Track your application statuses and see your placement history.</p>
                        </div>
                   </div>
                </div>
                <div class="col-md-4 mb-4">
                   <div class="card h-100 shadow-sm border-0 border-top border-primary border-4">
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-dark mb-3">Your Profile Stats</h5>
                            <div class="bg-light p-3 rounded mb-3">
                                <p class="mb-1 small"><strong>Name:</strong> {{ profileForm.name || 'Not set' }}</p>
                                <p class="mb-1 small"><strong>Branch:</strong> {{ profileForm.branch || 'Not set' }}</p>
                                <p class="mb-1 small"><strong>CGPA:</strong> {{ profileForm.cgpa ? parseFloat(profileForm.cgpa).toFixed(2) : 'Not set' }}</p>
                                <p class="mb-0 small"><strong>Resume:</strong> 
                                    <a v-if="profileForm.resume_link" :href="profileForm.resume_link" target="_blank" class="fw-bold text-primary text-decoration-none ms-1">View Document ↗</a>
                                    <span v-else class="text-danger ms-1">Missing Link!</span>
                                </p>
                            </div>
                            <button class="btn btn-outline-primary btn-sm w-100 shadow-none fw-bold" @click="showProfileForm = !showProfileForm">
                                <span v-if="!showProfileForm">Edit Profile</span>
                                <span v-else>Cancel Editing</span>
                            </button>
                        </div>
                   </div>
                </div>
            </div>
            
            <transition name="fade">
                <div class="card p-4 mt-2 shadow-sm border-0 bg-light" v-if="showProfileForm">
                    <h5 class="fw-bold mb-3">Edit Profile Settings</h5>
                    <form @submit.prevent="updateProfile">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">Full Name</label>
                                <input v-model="profileForm.name" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">Engineering Branch</label>
                                <input v-model="profileForm.branch" class="form-control form-control-sm" placeholder="e.g. CSE, ECE" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-4 mb-3">
                                <label class="text-muted small">Current CGPA</label>
                                <input v-model="profileForm.cgpa" type="number" step="0.1" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="text-muted small">Graduation Year</label>
                                <input v-model="profileForm.year_of_graduation" type="number" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-4 mb-3">
                                <label class="text-muted small">CV/Resume URL</label>
                                <input v-model="profileForm.resume_link" type="url" class="form-control form-control-sm" placeholder="https://drive.google.com/...">
                            </div>
                        </div>
                        <div class="text-end mt-2">
                             <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm">Save Profile Changes</button>
                        </div>
                    </form>
                </div>
            </transition>

            <div class="row mt-4">
                <div class="col-md-12">
                     <div class="card shadow-sm border-0 feature-card mb-4" style="cursor: pointer" @click="exportCSV">
                          <div class="card-body p-4 d-flex justify-content-between align-items-center">
                              <div>
                                 <h5 class="fw-bold text-dark mb-1">Export Application History</h5>
                                 <p class="text-muted small mb-0">Generate and download a comprehensive CSV spreadsheet containing your entire placement drive application records and current statuses.</p>
                              </div>
                              <button class="btn btn-light border-secondary btn-lg shadow-sm text-primary">
                                  Export CSV ⬇️
                              </button>
                          </div>
                     </div>
                     <div v-if="exportMsg" class="alert alert-success shadow-sm mt-2 border-0 fw-bold">{{ exportMsg }}</div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const exportMsg = ref('');
        const showProfileForm = ref(false);
        const profileForm = reactive({ name: '', branch: '', cgpa: '', year_of_graduation: '', resume_link: '' });

        onMounted(async () => {
            const res = await axios.get('/api/auth/me');
            if (res.data.student_profile) {
                Object.assign(profileForm, res.data.student_profile);
            }
        });

        const updateProfile = async () => {
            try {
                await axios.put('/api/student/profile', profileForm);
                alert('Profile updated successfully!');
                showProfileForm.value = false;
            } catch (e) {
                alert('Error updating profile');
            }
        };

        const exportCSV = async () => {
            try {
                exportMsg.value = 'Starting CSV Export...';
                const res = await axios.post('/api/student/export-csv');
                const taskId = res.data.task_id;
                exportMsg.value = `Task started. Generating your file...`;

                // Poll for status
                const interval = setInterval(async () => {
                    const statusRes = await axios.get(`/api/task-status/${taskId}`);
                    if (statusRes.data.state === 'SUCCESS') {
                        clearInterval(interval);
                        exportMsg.value = 'Export Complete! ';
                        // Create a download link
                        const downloadLink = document.createElement('a');
                        downloadLink.href = '/static/' + statusRes.data.result.split('/').pop();
                        downloadLink.innerText = 'Click here to Download CSV';
                        downloadLink.className = 'btn btn-sm btn-success mt-2 ms-2';
                        downloadLink.download = statusRes.data.result.split('/').pop();

                        // Let's add the button to the UI by appending it into the message container or just triggering it
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);

                        exportMsg.value = 'Export Complete! File downloaded successfully.';
                    } else if (statusRes.data.state === 'FAILURE') {
                        clearInterval(interval);
                        exportMsg.value = 'Failed to generate CSV file.';
                    }
                }, 2000);
            } catch (e) {
                exportMsg.value = 'Failed to start export task';
            }
        };
        return { exportCSV, exportMsg, showProfileForm, profileForm, updateProfile };
    }
};

const StudentDrives = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">Placement Drives</h2>
                <router-link to="/student/dashboard" class="btn btn-outline-secondary fw-bold">← Back to Dashboard</router-link>
            </div>
            <div class="mb-4 mt-3 w-50">
                <input type="text" class="form-control border-dark" placeholder="Search by Job Title or Company..." v-model="searchQuery" @input="load">
            </div>
            <div class="row mt-3">
                <div class="col-md-4 mb-4" v-for="d in drives" :key="d.id">
                    <div class="card h-100 shadow-sm border-0" :class="{'bg-light': !d.eligible}">
                        <div class="card-header bg-primary text-white">
                            <h5 class="mb-0">{{ d.job_title }}</h5>
                        </div>
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">{{ d.company_name }}</h6>
                            <p class="card-text small">{{ d.job_description.substring(0, 100) }}...</p>
                            <ul class="list-unstyled small">
                                <li><strong>Branches:</strong> {{ d.branch_eligibility }}</li>
                                <li><strong>Min CGPA:</strong> {{ d.min_cgpa }}</li>
                                <li><strong>Grad Year:</strong> {{ d.year_eligibility }}</li>
                                <li><strong>Deadline:</strong> {{ new Date(d.application_deadline).toLocaleDateString() }}</li>
                            </ul>
                        </div>
                        <div class="card-footer bg-white border-0 text-center">
                            <div v-if="!d.eligible" class="text-danger small fw-bold">Not Eligible</div>
                            <div v-else-if="d.applied" class="text-success small fw-bold">Applied</div>
                            <button v-else class="btn btn-primary btn-sm w-100" @click="apply(d.id)">Apply Now</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    setup() {
        const drives = ref([]);
        const searchQuery = ref('');
        const load = async () => {
            const res = await axios.get('/api/student/drives', { params: { search: searchQuery.value } });
            drives.value = res.data;
        };
        onMounted(load);

        const apply = async (id) => {
            try {
                await axios.post(`/api/student/drives/${id}/apply`);
                alert('Applied successfully!');
                load();
            } catch (e) {
                alert(e.response?.data?.msg || 'Error applying');
            }
        };

        return { drives, apply, searchQuery, load };
    }
}

const StudentApplications = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">My Applications</h2>
                <router-link to="/student/dashboard" class="btn btn-outline-secondary fw-bold">← Back to Dashboard</router-link>
            </div>
            <table class="table table-bordered mt-3">
                <thead class="table-dark">
                    <tr>
                        <th>Company</th>
                        <th>Job Title</th>
                        <th>Application Date</th>
                        <th>Status</th>
                        <th>Interview Details</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="a in apps" :key="a.id">
                        <td>{{ a.company_name }}</td>
                        <td>{{ a.job_title }}</td>
                        <td>{{ new Date(a.application_date).toLocaleString() }}</td>
                        <td>
                            <span class="badge" :class="{'bg-primary': a.status==='Applied', 'bg-info': a.status==='Shortlisted', 'bg-success': a.status==='Selected', 'bg-danger': a.status==='Rejected'}">
                                {{ a.status }}
                            </span>
                        </td>
                        <td>
                            <div v-if="a.interview_date" class="small">
                                <strong>Date:</strong> {{ new Date(a.interview_date).toLocaleString() }}<br>
                                <a :href="a.interview_link" target="_blank" v-if="a.interview_link" class="btn btn-outline-primary btn-sm mt-1">Join Interview</a>
                            </div>
                            <span v-else class="text-muted small">Not scheduled</span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        const apps = ref([]);
        onMounted(async () => {
            const res = await axios.get('/api/student/applications');
            apps.value = res.data;
        });
        return { apps };
    }
}

// --- company components ---
const CompanyDashboard = {
    template: `
        <div>
            <h2 class="mb-4 text-dark font-weight-bold">Company Dashboard</h2>
            <div class="row mt-4">
                <div class="col-md-6 mb-4">
                   <div class="card h-100 shadow-sm border-0 feature-card position-relative">
                        <div class="card-body p-4 text-center">
                            <h5 class="card-title fw-bold mb-3"><router-link to="/company/drives" class="text-primary text-decoration-none stretched-link">Manage Placement Drives</router-link></h5>
                            <p class="card-text text-muted small">Post new drives, review student applications, schedule interviews, and issue offer letters.</p>
                        </div>
                   </div>
                </div>
                <div class="col-md-6 mb-4">
                   <div class="card h-100 shadow-sm border-0 border-top border-info border-4">
                        <div class="card-body p-4">
                            <h5 class="card-title fw-bold text-dark mb-3">Company Profile</h5>
                            <div class="bg-light p-3 rounded mb-3">
                                <p class="mb-1 small"><strong>Company Name:</strong> {{ profileForm.company_name || 'Not set' }}</p>
                                <p class="mb-1 small"><strong>HR Contact:</strong> {{ profileForm.hr_contact || 'Not set' }}</p>
                                <p class="mb-0 small"><strong>Website:</strong> 
                                    <a v-if="profileForm.website" :href="profileForm.website" target="_blank" class="fw-bold text-info text-decoration-none ms-1">{{ profileForm.website }} ↗</a>
                                    <span v-else class="text-danger ms-1">Not set</span>
                                </p>
                            </div>
                            <button class="btn btn-outline-info btn-sm w-100 shadow-none fw-bold" @click="showProfileForm = !showProfileForm">
                                <span v-if="!showProfileForm">Edit Profile</span>
                                <span v-else>Cancel Editing</span>
                            </button>
                        </div>
                   </div>
                </div>
            </div>

            <transition name="fade">
                <div class="card p-4 mt-2 shadow-sm border-0 bg-light" v-if="showProfileForm">
                    <h5 class="fw-bold mb-3">Edit Profile Settings</h5>
                    <form @submit.prevent="updateProfile">
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">Company Name</label>
                                <input v-model="profileForm.company_name" class="form-control form-control-sm" required>
                            </div>
                            <div class="col-md-6 mb-3">
                                <label class="text-muted small">HR Contact Email/Phone</label>
                                <input v-model="profileForm.hr_contact" class="form-control form-control-sm" required>
                            </div>
                        </div>
                        <div class="row">
                            <div class="col-md-12 mb-3">
                                <label class="text-muted small">Company Website URL</label>
                                <input v-model="profileForm.website" type="url" class="form-control form-control-sm" placeholder="https://www.example.com">
                            </div>
                        </div>
                        <div class="text-end mt-2">
                             <button type="submit" class="btn btn-primary px-4 fw-bold shadow-sm">Save Profile Changes</button>
                        </div>
                    </form>
                </div>
            </transition>
        </div>
    `,
    setup() {
        const showProfileForm = ref(false);
        const profileForm = reactive({ company_name: '', hr_contact: '', website: '' });

        onMounted(async () => {
            const res = await axios.get('/api/auth/me');
            if (res.data.company_profile) {
                Object.assign(profileForm, res.data.company_profile);
            }
        });

        const updateProfile = async () => {
            try {
                await axios.put('/api/company/profile', profileForm);
                alert('Profile updated successfully!');
                showProfileForm.value = false;
            } catch (e) {
                alert('Error updating profile');
            }
        };

        return { showProfileForm, profileForm, updateProfile };
    }
};

const CompanyDrives = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">My Placement Drives</h2>
                <router-link to="/company/dashboard" class="btn btn-outline-secondary fw-bold">
                    ← Back to Dashboard
                </router-link>
            </div>
            <button class="btn mb-4 fw-bold shadow-sm" :class="showForm ? 'btn-danger' : 'btn-success'" @click="showForm = !showForm">
                {{ showForm ? 'Cancel Creation' : 'Create New Drive' }}
            </button>
            
            <div class="card p-4 mb-4" v-if="showForm">
                <h4>Create Drive</h4>
                <form @submit.prevent="createDrive">
                    <div class="row">
                        <div class="col-md-6 mb-3">
                            <label>Job Title</label>
                            <input v-model="form.job_title" class="form-control" required>
                        </div>
                        <div class="col-md-6 mb-3">
                            <label>Branch Eligibility</label>
                            <input v-model="form.branch_eligibility" class="form-control" required>
                        </div>
                    </div>
                    <div class="mb-3">
                        <label>Job Description</label>
                        <textarea v-model="form.job_description" class="form-control" required></textarea>
                    </div>
                    <div class="row">
                        <div class="col-md-4 mb-3">
                            <label>Min CGPA</label>
                            <input v-model="form.min_cgpa" type="number" step="0.1" class="form-control" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label>Year</label>
                            <input v-model="form.year_eligibility" type="number" class="form-control" required>
                        </div>
                        <div class="col-md-4 mb-3">
                            <label>Deadline (UTC)</label>
                            <input v-model="form.application_deadline" type="datetime-local" class="form-control" required>
                        </div>
                    </div>
                    <button type="submit" class="btn btn-primary">Submit for Approval</button>
                </form>
            </div>

            <table class="table table-bordered table-striped mt-3">
                <thead class="table-dark">
                    <tr>
                        <th>Title</th>
                        <th>Deadline</th>
                        <th>Status</th>
                        <th>Applicants</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="d in drives" :key="d.id">
                        <td>{{ d.job_title }}</td>
                        <td>{{ new Date(d.application_deadline).toLocaleString() }}</td>
                        <td>
                            <span class="badge" :class="{'bg-warning': d.status==='Pending', 'bg-success': d.status==='Approved', 'bg-secondary': d.status==='Closed'}">
                                {{ d.status }}
                            </span>
                        </td>
                        <td>{{ d.applicants_count }}</td>
                        <td>
                            <router-link :to="'/company/drives/' + d.id + '/applications'" class="btn btn-sm btn-info">View Apps</router-link>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        const drives = ref([]);
        const showForm = ref(false);
        const form = reactive({
            job_title: '', job_description: '', branch_eligibility: '', min_cgpa: '', year_eligibility: '', application_deadline: ''
        });

        const load = async () => {
            const res = await axios.get('/api/company/drives');
            drives.value = res.data;
        };
        onMounted(load);

        const createDrive = async () => {
            // append Z for UTC
            const data = { ...form, application_deadline: form.application_deadline + ":00Z" };
            try {
                await axios.post('/api/company/drives', data);
                showForm.value = false;
                load();
            } catch (e) {
                alert('Error: ' + (e.response?.data?.msg || 'Network error'));
            }
        };

        return { drives, showForm, form, createDrive };
    }
};

const CompanyApplications = {
    template: `
        <div>
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2 class="mb-0 text-dark font-weight-bold">Applications for Drive #{{ $route.params.id }}</h2>
                <router-link to="/company/drives" class="btn btn-outline-secondary fw-bold">← Back to Drives</router-link>
            </div>
            
            <div v-if="loading" class="text-center mt-5">Loading applications...</div>
            
            <table class="table table-bordered">
                <thead class="table-dark">
                    <tr>
                        <th>Student Name</th>
                        <th>Branch</th>
                        <th>CGPA</th>
                        <th>Resume</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Interview Details</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="a in apps" :key="a.application_id">
                        <td>{{ a.student_name }}</td>
                        <td>{{ a.branch }}</td>
                        <td>{{ a.cgpa }}</td>
                        <td><a :href="a.resume_link" target="_blank" v-if="a.resume_link">Link</a><span v-else>N/A</span></td>
                        <td>{{ new Date(a.application_date).toLocaleDateString() }}</td>
                        <td>
                            <span class="badge" :class="{'bg-primary': a.status==='Applied', 'bg-info': a.status==='Shortlisted', 'bg-success': a.status==='Selected', 'bg-danger': a.status==='Rejected'}">
                                {{ a.status }}
                            </span>
                        </td>
                        <td>
                             <div v-if="a.status === 'Shortlisted' || a.status === 'Selected'">
                                <div class="mb-1">
                                    <input type="datetime-local" class="form-control form-control-sm mb-1" v-model="a.new_interview_date" title="Interview Date">
                                    <input type="url" class="form-control form-control-sm" v-model="a.new_interview_link" placeholder="Interview Link">
                                </div>
                                <button class="btn btn-warning btn-sm w-100" @click="scheduleInterview(a.application_id, a.new_interview_date, a.new_interview_link)">Schedule</button>
                                <div v-if="a.interview_date" class="mt-2 text-muted small">
                                    <strong>Scheduled:</strong> {{ new Date(a.interview_date).toLocaleString() }}<br>
                                    <a :href="a.interview_link" target="_blank" v-if="a.interview_link">Join Link</a>
                                </div>
                             </div>
                             <div v-else class="text-muted small">Shortlist candidate first</div>
                        </td>
                        <td>
                            <select class="form-select form-select-sm mb-1" @change="updateStatus(a.application_id, $event.target.value)">
                                <option disabled selected>Update</option>
                                <option value="Shortlisted">Shortlist</option>
                                <option value="Selected">Select</option>
                                <option value="Rejected">Reject</option>
                            </select>
                            <button v-if="a.status === 'Selected'" class="btn btn-primary btn-sm w-100" @click="generateOffer(a.application_id)">Send Offer</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    `,
    setup() {
        return {};
    },
    data() {
        return { apps: [] };
    },
    async mounted() {
        this.load();
    },
    methods: {
        async load() {
            const res = await axios.get(`/api/company/drives/${this.$route.params.id}/applications`);
            this.apps = res.data.map(app => ({
                ...app,
                new_interview_date: app.interview_date ? app.interview_date.slice(0, 16) : '',
                new_interview_link: app.interview_link || ''
            }));
        },
        async updateStatus(appId, status) {
            await axios.put(`/api/company/applications/${appId}/status`, { status });
            this.load();
        },
        async scheduleInterview(appId, dateVal, linkVal) {
            if (!dateVal && !linkVal) return;
            try {
                // Ensure properly formatted UTC Z if not empty
                const formattedDate = dateVal ? (dateVal.includes('Z') ? dateVal : dateVal + ":00Z") : null;
                await axios.put(`/api/company/applications/${appId}/interview`, {
                    interview_date: formattedDate,
                    interview_link: linkVal
                });
                alert('Interview Scheduled!');
                this.load();
            } catch (e) {
                alert(e.response?.data?.msg || 'Error scheduling interview');
            }
        },
        async generateOffer(appId) {
            try {
                const res = await axios.post(`/api/company/applications/${appId}/offer`, { salary: '10 LPA', joining_date: 'Fall' });
                alert(res.data.msg + "\\n\\n" + res.data.letter);
            } catch (e) {
                alert(e.response?.data?.msg || 'Error generating offer');
            }
        }
    }
}


// Router
const routes = [
    { path: '/', component: Home },
    { path: '/login', component: Login },
    { path: '/register', component: Register },
    { path: '/admin/dashboard', component: AdminDashboard },
    { path: '/admin/companies', component: AdminCompanies },
    { path: '/admin/students', component: AdminStudents },
    { path: '/admin/drives', component: AdminDrives },
    { path: '/student/dashboard', component: StudentDashboard },
    { path: '/student/drives', component: StudentDrives },
    { path: '/student/applications', component: StudentApplications },
    { path: '/company/dashboard', component: CompanyDashboard },
    { path: '/company/drives', component: CompanyDrives },
    { path: '/company/drives/:id/applications', component: CompanyApplications },
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

// App initialization
const App = {
    setup() {
        const isAuthenticated = ref(!!localStorage.getItem('token'));
        const role = ref(localStorage.getItem('role') || '');
        const userName = ref(localStorage.getItem('name') || '');

        onMounted(async () => {
            if (isAuthenticated.value && !userName.value) {
                try {
                    const res = await axios.get('/api/auth/me');
                    let name = 'Admin';
                    if (res.data.role === 'student' && res.data.student_profile) {
                        name = res.data.student_profile.name;
                    } else if (res.data.role === 'company' && res.data.company_profile) {
                        name = res.data.company_profile.company_name;
                    }
                    userName.value = name;
                    localStorage.setItem('name', name);
                } catch (e) {
                    console.error("Failed to fetch user context", e);
                }
            }
        });

        const logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('role');
            localStorage.removeItem('name');
            isAuthenticated.value = false;
            role.value = '';
            userName.value = '';
            window.location.href = '/';
        };

        return { isAuthenticated, role, userName, logout };
    }
};

const app = createApp(App);
app.use(router);
app.mount('#app');
