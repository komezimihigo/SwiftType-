/**
* Admin Dashboard Module
* Handles admin panel functionality and data loading
*/

// Current selected user ID for modal
let selectedUserId = null;

document.addEventListener('DOMContentLoaded', async () => {
    // Load initial data
    await loadOverviewData();

    // Tab switching
    setupTabSwitching();

    // Modal setup
    setupModal();

    // Event listeners
    setupEventListeners();
});

/**
* Setup tab switching functionality
*/
function setupTabSwitching() {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset.tab;

            // Hide all tabs
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            // Remove active class from buttons
            tabButtons.forEach(b => b.classList.remove('active'));

            // Show selected tab
            document.getElementById(tabName).classList.add('active');
            e.target.classList.add('active');

            // Load tab data
            loadTabData(tabName);
        });
    });
}

/**
* Load data for selected tab
*/
async function loadTabData(tabName) {
    switch(tabName) {
        case 'users':
            await loadUsers();
            break;
        case 'results':
            await loadResults();
            break;
        case 'visitors':
            await loadVisitors();
            break;
        case 'stats':
            await loadStats();
            break;
    }
}

/**
* Load overview data
*/
async function loadOverviewData() {
    try {
        // Load users
        const usersRes = await fetch('/admin/api/users');
        const usersData = await usersRes.json();
        document.getElementById('totalUsers').textContent = usersData.total_users;

        // Load stats
        const statsRes = await fetch('/admin/api/stats');
        const statsData = await statsRes.json();

        // Calculate total tests
        let totalTests = 0;
        statsData.stats.forEach(stat => {
            totalTests += stat.total_tests || 0;
        });
        document.getElementById('totalTests').textContent = totalTests;

        // Load visitor stats
        const visitorStatsRes = await fetch('/admin/api/visitor-stats');
        const visitorStatsData = await visitorStatsRes.json();
        document.getElementById('totalVisits').textContent = visitorStatsData.stats.total_visits;
        document.getElementById('uniqueIps').textContent = visitorStatsData.stats.unique_ips;

        // Load top users
        await loadTopUsers(statsData.stats);

        // Load recent visitors
        await loadRecentVisitors();

    } catch (error) {
        console.error('Error loading overview:', error);
    }
}

/**
* Load top users for overview
*/
async function loadTopUsers(stats) {
    const tbody = document.getElementById('topUsersTable');

    // Sort by tests and limit to 10
    const topUsers = stats
        .filter(stat => stat.total_tests > 0)
        .sort((a, b) => b.total_tests - a.total_tests)
        .slice(0, 10);

    if (topUsers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5">No test results yet</td></tr>';
        return;
    }

    let html = '';
    topUsers.forEach(user => {
        html += `
            <tr>
                <td>${escapeHtml(user.username)}</td>
                <td>${user.total_tests}</td>
                <td>${user.avg_wpm || 0}</td>
                <td>${user.best_wpm || 0}</td>
                <td>${user.avg_accuracy || 0}%</td>
            </tr>
        `;
    });

    tbody.innerHTML = html;
}

/**
* Load recent visitors
*/
async function loadRecentVisitors() {
    try {
        const response = await fetch('/admin/api/visitors?limit=10');
        const data = await response.json();

        const tbody = document.getElementById('recentVisitorsTable');

        if (!data.visitors || data.visitors.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No visitors yet</td></tr>';
            return;
        }

        let html = '';
        data.visitors.forEach(visitor => {
            const time = new Date(visitor.visit_timestamp).toLocaleString();
            const status = visitor.is_logged_in ? '✓ Logged In' : 'Guest';
            const statusClass = visitor.is_logged_in ? 'status-logged' : 'status-guest';

            html += `
                <tr>
                    <td><code>${escapeHtml(visitor.ip_address)}</code></td>
                    <td>${visitor.country || 'Unknown'}</td>
                    <td>${visitor.city || 'Unknown'}</td>
                    <td>${time}</td>
                    <td><span class="status ${statusClass}">${status}</span></td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading visitors:', error);
    }
}

/**
* Load all users
*/
async function loadUsers() {
    try {
        const response = await fetch('/admin/api/users');
        const data = await response.json();

        const tbody = document.getElementById('usersTable');

        if (!data.users || data.users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No users found</td></tr>';
            return;
        }

        let html = '';
        data.users.forEach(user => {
            const adminBadge = user.is_admin ? '<span class="badge badge-admin">Admin</span>' : '';
            const joinDate = new Date(user.created_at).toLocaleDateString();

            html += `
                <tr>
                    <td>${user.id}</td>
                    <td>${escapeHtml(user.username)}</td>
                    <td>${escapeHtml(user.email)}</td>
                    <td>${adminBadge}</td>
                    <td>${joinDate}</td>
                    <td>
                        <button class="btn-small btn-info" onclick="openUserModal(${user.id})">View</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

/**
* Load all results
*/
async function loadResults() {
    try {
        const limit = document.getElementById('resultLimit')?.value || 50;
        const response = await fetch(`/admin/api/results?limit=${limit}`);
        const data = await response.json();

        const tbody = document.getElementById('resultsTable');

        if (!data.results || data.results.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No results found</td></tr>';
            return;
        }

        let html = '';
        data.results.forEach(result => {
            const date = new Date(result.test_date).toLocaleDateString();

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${escapeHtml(result.username)}</td>
                    <td>${result.wpm}</td>
                    <td>${result.raw_wpm}</td>
                    <td>${result.accuracy}%</td>
                    <td>${result.errors}</td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading results:', error);
    }
}

/**
* Load visitors and visitor stats
*/
async function loadVisitors() {
    try {
        // Load visitor stats
        const statsRes = await fetch('/admin/api/visitor-stats');
        const statsData = await statsRes.json();

        document.getElementById('visitorTotal').textContent = statsData.stats.total_visits;
        document.getElementById('visitorUnique').textContent = statsData.stats.unique_ips;
        document.getElementById('visitorLoggedIn').textContent = statsData.stats.logged_in_visits;

        // Load top countries
        const countriesTbody = document.getElementById('countriesTable');
        const totalVisits = statsData.stats.total_visits;

        let countriesHtml = '';
        statsData.countries.forEach(country => {
            const percentage = ((country.visits / totalVisits) * 100).toFixed(1);
            countriesHtml += `
                <tr>
                    <td>${country.country || 'Unknown'}</td>
                    <td>${country.visits}</td>
                    <td><div class="progress-bar" style="width: ${percentage}%"></div>${percentage}%</td>
                </tr>
            `;
        });
        countriesTbody.innerHTML = countriesHtml || '<tr><td colspan="3">No visitor data</td></tr>';

        // Load visitor log
        const visitorsRes = await fetch('/admin/api/visitors?limit=100');
        const visitorsData = await visitorsRes.json();

        const visitorsTbody = document.getElementById('visitorsTable');
        let visitorsHtml = '';
        visitorsData.visitors.forEach(visitor => {
            const time = new Date(visitor.visit_timestamp).toLocaleString();
            const loggedIn = visitor.is_logged_in ? '✓ Yes' : 'No';
            const userId = visitor.user_id || '-';

            visitorsHtml += `
                <tr>
                    <td><code>${escapeHtml(visitor.ip_address)}</code></td>
                    <td>${visitor.country || 'Unknown'}</td>
                    <td>${visitor.city || 'Unknown'}</td>
                    <td>${time}</td>
                    <td>${loggedIn}</td>
                    <td>${userId}</td>
                </tr>
            `;
        });
        visitorsTbody.innerHTML = visitorsHtml || '<tr><td colspan="6">No visitors</td></tr>';

    } catch (error) {
        console.error('Error loading visitors:', error);
    }
}

/**
* Load user statistics
*/
async function loadStats() {
    try {
        const response = await fetch('/admin/api/stats');
        const data = await response.json();

        const tbody = document.getElementById('statsTable');

        if (!data.stats || data.stats.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No statistics available</td></tr>';
            return;
        }

        let html = '';
        data.stats.forEach(stat => {
            html += `
                <tr>
                    <td>${escapeHtml(stat.username)}</td>
                    <td>${stat.total_tests}</td>
                    <td>${stat.avg_wpm || 0}</td>
                    <td>${stat.best_wpm || 0}</td>
                    <td>${stat.avg_accuracy || 0}%</td>
                    <td>
                        <button class="btn-small btn-info" onclick="openUserModal(${stat.id})">View</button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

/**
* Open user details modal
*/
async function openUserModal(userId) {
    selectedUserId = userId;

    try {
        const response = await fetch(`/admin/api/user/${userId}/stats`);
        const data = await response.json();

        if (!data.success) {
            alert('Error loading user details');
            return;
        }

        const user = data.user;
        const stats = data.stats;

        // Update modal header
        document.getElementById('modalUserName').textContent = user.username;
        document.getElementById('modalEmail').textContent = user.email;
        document.getElementById('modalAdmin').textContent = user.is_admin ? 'Yes' : 'No';
        document.getElementById('modalJoined').textContent = new Date(user.created_at).toLocaleDateString();

        // Update admin toggle
        document.getElementById('adminToggle').checked = user.is_admin;

        // Load user results
        const resultsRes = await fetch(`/admin/api/user/${userId}/results`);
        const resultsData = await resultsRes.json();

        const resultsTbody = document.getElementById('userResultsTable');

        if (resultsData.results.length === 0) {
            resultsTbody.innerHTML = '<tr><td colspan="4">No test results</td></tr>';
        } else {
            let html = '';
            resultsData.results.forEach(result => {
                const date = new Date(result.test_date).toLocaleDateString();
                html += `
                    <tr>
                        <td>${date}</td>
                        <td>${result.wpm}</td>
                        <td>${result.accuracy}%</td>
                        <td>${result.errors}</td>
                    </tr>
                `;
            });
            resultsTbody.innerHTML = html;
        }

        // Show modal
        document.getElementById('userModal').style.display = 'block';

    } catch (error) {
        console.error('Error loading user details:', error);
        alert('Error loading user details');
    }
}

/**
* Setup modal functionality
*/
function setupModal() {
    const modal = document.getElementById('userModal');
    const closeBtn = modal.querySelector('.close');
    const modalTabBtns = modal.querySelectorAll('.modal-tab-btn');
    const modalTabContents = modal.querySelectorAll('.modal-tab-content');

    // Close button
    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    // Tab switching
    modalTabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabName = e.target.dataset['modal-tab'];

            modalTabContents.forEach(content => {
                content.classList.remove('active');
            });

            modalTabBtns.forEach(b => b.classList.remove('active'));

            modal.querySelector(`#${tabName}`).classList.add('active');
            e.target.classList.add('active');
        });
    });

    // Close when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
}

/**
* Setup event listeners
*/
function setupEventListeners() {
    // Admin toggle in modal
    const adminToggle = document.getElementById('adminToggle');
    if (adminToggle) {
        adminToggle.addEventListener('change', async (e) => {
            if (!selectedUserId) return;

            try {
                const response = await fetch('/admin/api/set-admin', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: selectedUserId,
                        is_admin: e.target.checked
                    })
                });

                const data = await response.json();
                if (!data.success) {
                    alert(data.error);
                    e.target.checked = !e.target.checked;
                }
            } catch (error) {
                console.error('Error setting admin status:', error);
                alert('Error updating admin status');
                e.target.checked = !e.target.checked;
            }
        });
    }

    // Result limit filter
    const resultLimit = document.getElementById('resultLimit');
    if (resultLimit) {
        resultLimit.addEventListener('change', async () => {
            await loadResults();
        });
    }
}

/**
* Escape HTML special characters
*/
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text).replace(/[&<>"']/g, m => map[m]);
}

