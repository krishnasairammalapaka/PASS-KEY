const API_URL = 'http://localhost:3000/api';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    const authenticated = sessionStorage.getItem('authenticated');
    const email = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');

    if (!authenticated || !email || userType !== 'admin') {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/admin-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('adminEmail').textContent = data.adminData.email;
            document.getElementById('lastLoginTime').textContent = 
                new Date(data.adminData.lastLogin).toLocaleString();
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('activeUsers').textContent = data.stats.activeUsers;
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
});

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
} 