/**
* Auth Module - Handles authentication UI
*/

document.addEventListener('DOMContentLoaded', async () => {
    // Check login status on page load
    await checkLoginStatus();
});

/**
* Check if user is logged in
*/
async function checkLoginStatus() {
    try {
        const response = await fetch('/auth/status');
        const data = await response.json();

        const loginLink = document.getElementById('loginLink');
        const registerLink = document.getElementById('registerLink');
        const logoutBtn = document.getElementById('logoutBtn');
        const dashboardLink = document.getElementById('dashboardLink');

        if (data.logged_in) {
            // User is logged in
            if (loginLink) loginLink.style.display = 'none';
            if (registerLink) registerLink.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'block';
            if (dashboardLink) dashboardLink.style.display = 'block';

            // Add logout functionality
            if (logoutBtn) {
                logoutBtn.addEventListener('click', logout);
            }
        } else {
            // User is not logged in
            if (loginLink) loginLink.style.display = 'block';
            if (registerLink) registerLink.style.display = 'block';
            if (logoutBtn) logoutBtn.style.display = 'none';
            if (dashboardLink) dashboardLink.style.display = 'none';
        }
    } catch (error) {
        console.error('Error checking login status:', error);
    }
}

/**
* Logout user
*/
async function logout() {
    try {
        const response = await fetch('/auth/logout', {
            method: 'POST'
        });

        const data = await response.json();

        if (data.success) {
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Error logging out:', error);
    }
}


