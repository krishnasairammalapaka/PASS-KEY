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

    await loadAdminDashboard();
    await loadUserList();
    await loadActivityLogs();
});

async function loadAdminDashboard() {
    try {
        const response = await fetch(`${API_URL}/admin-data`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                email: sessionStorage.getItem('userEmail')
            })
        });

        const data = await response.json();
        if (data.success) {
            // Update admin info
            document.getElementById('adminEmail').textContent = data.adminData.email;
            document.getElementById('lastLoginTime').textContent = 
                new Date(data.adminData.lastLogin).toLocaleString();
            document.getElementById('adminRole').textContent = data.adminData.role;

            // Update statistics
            document.getElementById('totalUsers').textContent = data.stats.totalUsers;
            document.getElementById('activeUsers').textContent = data.stats.activeUsers;
            document.getElementById('verifiedUsers').textContent = data.stats.verifiedUsers;

            // Update user table
            const userTableBody = document.getElementById('userTableBody');
            userTableBody.innerHTML = '';

            data.users.forEach(user => {
                const row = document.createElement('tr');
                row.className = 'hover:bg-gray-750 transition-all duration-150';
                row.innerHTML = `
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="flex items-center">
                            <div class="ml-4">
                                <div class="text-sm font-semibold text-gray-200">${user.email}</div>
                            </div>
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <span class="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                            ${user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                            shadow-sm">
                            ${user.verified ? 'Verified' : 'Pending'}
                        </span>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-300">
                            ${new Date(user.createdAt).toLocaleDateString()}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap">
                        <div class="text-sm font-medium text-gray-300">
                            ${new Date(user.lastLogin).toLocaleString()}
                        </div>
                    </td>
                    <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button onclick="viewUserDetails('${user.email}')" 
                            class="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 
                            text-white font-medium rounded-lg transition-all duration-200 shadow-sm">
                            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" 
                                    d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                            </svg>
                            View
                        </button>
                        <button onclick="toggleUserStatus('${user.email}', ${user.verified})" 
                            class="inline-flex items-center px-3 py-1.5 
                            ${user.verified ? 
                                'bg-yellow-600 hover:bg-yellow-700' : 
                                'bg-green-600 hover:bg-green-700'} 
                            text-white font-medium rounded-lg transition-all duration-200 shadow-sm">
                            <svg class="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                ${user.verified ?
                                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>' :
                                    '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>'
                                }
                            </svg>
                            ${user.verified ? 'Suspend' : 'Activate'}
                        </button>
                    </td>
                `;
                userTableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function loadUserList() {
    try {
        const response = await fetch(`${API_URL}/users-list`);
        const data = await response.json();

        const userTableBody = document.getElementById('userTableBody');
        userTableBody.innerHTML = '';

        data.users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-750';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="ml-4">
                            <div class="text-sm font-medium text-gray-300">${user.email}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.verified ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}">
                        ${user.verified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${new Date(user.createdAt).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${new Date(user.lastLogin).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onclick="viewUserDetails('${user.email}')" 
                        class="text-blue-500 hover:text-blue-600 mr-3">
                        View
                    </button>
                    <button onclick="toggleUserStatus('${user.email}', ${user.verified})" 
                        class="text-${user.verified ? 'yellow' : 'green'}-500 hover:text-${user.verified ? 'yellow' : 'green'}-600">
                        ${user.verified ? 'Suspend' : 'Activate'}
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });

        // Update stats in the cards
        document.getElementById('totalUsers').textContent = data.users.length;
        document.getElementById('verifiedUsers').textContent = 
            data.users.filter(user => user.verified).length;
        document.getElementById('activeUsers').textContent = 
            data.users.filter(user => {
                const lastLogin = new Date(user.lastLogin);
                const today = new Date();
                return lastLogin.toDateString() === today.toDateString();
            }).length;

    } catch (error) {
        console.error('Error loading user list:', error);
    }
}

async function loadActivityLogs() {
    try {
        const response = await fetch(`${API_URL}/activity-logs`);
        const data = await response.json();

        const logsContainer = document.getElementById('activityLogs');
        logsContainer.innerHTML = '';

        data.logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'bg-gray-700 rounded-lg p-4';
            logEntry.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-gray-300">${log.email}</p>
                        <p class="text-sm text-gray-400">${log.action}</p>
                    </div>
                    <span class="text-sm text-gray-400">
                        ${new Date(log.timestamp).toLocaleString()}
                    </span>
                </div>
            `;
            logsContainer.appendChild(logEntry);
        });
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

function refreshUserList() {
    loadUserList();
    loadActivityLogs();
}

async function viewUserDetails(email) {
    try {
        const response = await fetch(`${API_URL}/user-details`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        if (data.success) {
            // Show user details in a modal or detailed view
            alert(`
                User Details:
                Email: ${data.userDetails.email}
                Status: ${data.userDetails.verified ? 'Verified' : 'Pending'}
                Created: ${new Date(data.userDetails.createdAt).toLocaleString()}
                Last Login: ${new Date(data.userDetails.lastLogin).toLocaleString()}
            `);
        }
    } catch (error) {
        console.error('Error loading user details:', error);
    }
}

// Add function to toggle user status
async function toggleUserStatus(email, currentStatus) {
    try {
        const response = await fetch(`${API_URL}/toggle-user-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, newStatus: !currentStatus })
        });

        const data = await response.json();
        if (data.success) {
            await loadUserList(); // Refresh the list
        }
    } catch (error) {
        console.error('Error toggling user status:', error);
    }
}

function logout() {
    sessionStorage.clear();
    window.location.href = 'index.html';
} 