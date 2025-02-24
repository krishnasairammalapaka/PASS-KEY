const API_URL = 'http://localhost:3000/api';

// Check authentication on page load
document.addEventListener('DOMContentLoaded', async function() {
    const authenticated = sessionStorage.getItem('authenticated');
    const email = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');

    if (!authenticated || !email || userType !== 'user') {
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/user-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        if (data.success) {
            document.getElementById('userEmail').textContent = data.userData.email;
            document.getElementById('lastLoginTime').textContent = 
                new Date(data.userData.lastLogin).toLocaleString();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
});

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
} 