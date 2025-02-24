const API_URL = 'http://localhost:3000/api';

// Basic utility functions
function showError(message) {
    const errorMessage = document.getElementById('errorMessage');
    errorMessage.textContent = message;
    errorMessage.classList.remove('hidden');
    setTimeout(() => {
        errorMessage.classList.add('hidden');
    }, 3000);
}

function setSession(email, userType) {
    sessionStorage.setItem('userEmail', email);
    sessionStorage.setItem('userType', userType);
}

function clearSession() {
    sessionStorage.clear();
}

async function handleLogin() {
    const email = document.getElementById('email').value;
    if (!email) {
        showError('Please enter an email address');
        return;
    }
    
    try {
        // First check if it's an admin
        const response = await fetch(`${API_URL}/check-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });

        const data = await response.json();
        
        if (!data.success) {
            showError('User not found');
            return;
        }

        // Store user information
        setSession(email, data.userType);

        // Show QR section or TOTP input based on verification status
        if (!data.verified) {
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('qrSection').classList.remove('hidden');
            
            // Generate QR code for unverified users
            const qrResponse = await fetch(`${API_URL}/generate-qr`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, userType: data.userType })
            });

            const qrData = await qrResponse.json();
            document.getElementById('qrCode').src = qrData.qrCode;
            document.getElementById('secretCode').textContent = qrData.secret;
        } else {
            // For verified users, show only TOTP input
            document.getElementById('loginForm').classList.add('hidden');
            document.getElementById('qrSection').classList.remove('hidden');
            document.querySelector('.bg-white.p-4').style.display = 'none';
            document.querySelector('.text-gray-400.text-sm').style.display = 'none';
        }

    } catch (error) {
        console.error('Login error:', error);
        showError('An error occurred during login');
    }
}

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
                window.location.href = '/admin-dashboard';
            } else {
                window.location.href = '/user-dashboard';
            }
        } else {
            showError(result.message || 'Invalid verification code');
        }
    } catch (error) {
        console.error('Verification error:', error);
        showError('An error occurred during verification');
    }
}

function logout() {
    clearSession();
    window.location.href = 'index.html';
}

// Initialize page
document.addEventListener('DOMContentLoaded', function() {
    // Clear any existing session data on the login page
    if (window.location.pathname === '/index.html' || window.location.pathname === '/') {
        clearSession();
    }
    
    // Check authentication for dashboard pages
    if (window.location.pathname.includes('dashboard')) {
        const authenticated = sessionStorage.getItem('authenticated');
        if (!authenticated) {
            window.location.href = 'index.html';
        }
    }
});


