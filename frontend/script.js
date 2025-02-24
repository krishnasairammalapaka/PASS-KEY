const API_URL = 'http://localhost:3000/api';

function showError(message) {
    const errorContainer = document.getElementById('errorContainer');
    errorContainer.textContent = message;
    errorContainer.classList.remove('hidden');
}

// Session handling
function setSession(email) {
    localStorage.setItem('userEmail', email);
}

function getSession() {
    return localStorage.getItem('userEmail');
}

function clearSession() {
    localStorage.removeItem('userEmail');
}

// Authentication check
async function checkAuth() {
    const email = getSession();
    if (!email || !sessionStorage.getItem('authenticated')) {
        window.location.href = '/';
        return false;
    }

    try {
        const response = await fetch('/api/validate-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (!data.success) {
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = '/';
        return false;
    }
}

async function logout() {
    clearSession();
    sessionStorage.removeItem('authenticated');
    window.location.href = '/';
}

// Load user data for dashboard
async function loadUserData() {
    const email = getSession();
    if (!email || !sessionStorage.getItem('authenticated')) return;

    try {
        const response = await fetch('/api/user-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (data.success) {
            document.getElementById('userDisplayEmail').textContent = data.userData.email;
            document.getElementById('lastLogin').textContent = new Date(data.userData.lastLogin).toLocaleString();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const email = document.getElementById('email').value;
            setSession(email);

            try {
                const response = await fetch(`${API_URL}/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email })
                });
                const data = await response.json();
                
                if (data.success) {
                    if (data.isNewUser && data.qrCode) {
                        const qrContainer = document.getElementById('qrContainer');
                        qrContainer.innerHTML = `
                            <div class="space-y-6">
                                <div>
                                    <p class="text-sm text-gray-600">
                                        1. Install Microsoft Authenticator on your phone
                                    </p>
                                    <p class="text-sm text-gray-600">
                                        2. Scan this QR code with the app:
                                    </p>
                                    <div class="mt-4 flex justify-center">
                                        <img src="${data.qrCode}" alt="QR Code" class="w-48 h-48">
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">
                                        Or manually enter this code in your authenticator app:
                                    </p>
                                    <code class="block mt-2 p-2 bg-gray-100 rounded text-center select-all">
                                        ${data.secret}
                                    </code>
                                </div>
                                <button onclick="proceedToTOTP()" 
                                        class="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500">
                                    I've scanned the code
                                </button>
                            </div>
                        `;
                    } else {
                        window.location.href = 'totp.html';
                    }
                }
            } catch (error) {
                showError('An error occurred. Please try again.');
            }
        });
    }

    // Handle TOTP verification
    const totpForm = document.getElementById('totpForm');
    if (totpForm) {
        const userEmail = getSession();
        if (!userEmail) {
            window.location.href = 'index.html';
            return;
        }

        document.getElementById('userEmail').textContent = userEmail;

        totpForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            const token = document.getElementById('totp').value;
            
            try {
                const response = await fetch(`${API_URL}/verify`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        token: token
                    })
                });
                const data = await response.json();
                
                if (data.success) {
                    sessionStorage.setItem('authenticated', 'true');
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Invalid authentication code. Please try again.');
                }
            } catch (error) {
                console.error('Error:', error);
                alert('An error occurred. Please try again.');
            }
        });
    }

    // Handle dashboard
    const userDisplayEmail = document.getElementById('userDisplayEmail');
    if (userDisplayEmail) {
        if (!sessionStorage.getItem('authenticated')) {
            window.location.href = 'index.html';
            return;
        }
        
        loadUserData();
    }
});

// Update navigation functions
async function handleLogin() {
    const email = document.getElementById('email').value;
    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        const data = await response.json();
        
        if (data.success) {
            setSession(email);
            if (data.verified) {
                window.location.href = '/totp';  // Updated path
            } else {
                displayQRCode(data.qrCode, data.secret);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error during login/registration');
    }
}

async function verifyToken() {
    // ...existing verification code...
    if (data.success) {
        sessionStorage.setItem('authenticated', 'true');
        window.location.href = '/dashboard';  // Updated path
    }
    // ...rest of the code...
}

async function logout() {
    clearSession();
    sessionStorage.removeItem('authenticated');
    window.location.href = '/';  // Updated path
}

// Update checkAuth redirect
async function checkAuth() {
    const email = getSession();
    if (!email || !sessionStorage.getItem('authenticated')) {
        window.location.href = '/';  // Updated path
        return false;
    }
    // ...rest of the code...
}
