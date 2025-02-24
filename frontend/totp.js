const API_URL = 'http://localhost:3000/api';

function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

// Check if user is properly redirected from login
document.addEventListener('DOMContentLoaded', async function() {
    const email = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');

    if (!email || !userType) {
        window.location.href = '/index.html';
        return;
    }

    try {
        const response = await fetch(`${API_URL}/check-verification-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, userType })
        });

        const data = await response.json();

        if (!data.verified) {
            // Show QR setup for first-time users
            document.getElementById('qrSetup').classList.remove('hidden');
            const qrResponse = await fetch(`${API_URL}/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, userType })
            });

            const qrData = await qrResponse.json();
            document.getElementById('qrCode').src = qrData.qrCode;
            document.getElementById('secretCode').textContent = qrData.secret;
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred. Please try again.');
    }
});

async function verifyToken() {
    const token = document.getElementById('token').value;
    const email = sessionStorage.getItem('userEmail');
    const userType = sessionStorage.getItem('userType');

    if (!token || token.length !== 6) {
        showError('Please enter a valid 6-digit code');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/verify-token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, token, userType })
        });

        const result = await response.json();

        if (result.success) {
            sessionStorage.setItem('authenticated', 'true');
            
            // Redirect based on user type
            if (userType === 'admin') {
                window.location.href = '/admin-dashboard.html';
            } else {
                window.location.href = '/user-dashboard.html';
            }
        } else {
            showError(result.message || 'Invalid verification code');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('An error occurred during verification');
    }
} 