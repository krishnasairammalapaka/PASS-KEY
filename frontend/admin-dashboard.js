// Remove the import statements at the top and use the global supabaseClient
const supabase = window.supabaseClient;

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
        await loadAdminDashboard();
        await loadUserList();
        await loadActivityLogs();
    } catch (error) {
        console.error('Error initializing dashboard:', error);
    }
});

async function loadAdminDashboard() {
    try {
        // Fetch admin data from Supabase
        const { data: adminData, error: adminError } = await supabase
            .from('admins')
            .select('*')
            .eq('email', sessionStorage.getItem('userEmail'))
            .single();

        if (adminError) throw adminError;

        // Update admin info
        document.getElementById('adminEmail').textContent = adminData.email;
        document.getElementById('lastLoginTime').textContent = 
            new Date(adminData.last_login).toLocaleString();
        document.getElementById('adminRole').textContent = adminData.role;

    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

async function loadUserList() {
    const userTableBody = document.getElementById('userTableBody');
    try {
        userTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                    Loading users...
                </td>
            </tr>
        `;

        // Fetch all users from Supabase
        const { data: users, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;

        // Update total users count
        document.getElementById('totalUsersCount').textContent = users.length;
        
        // Clear loading message
        userTableBody.innerHTML = '';

        if (!users || users.length === 0) {
            userTableBody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                        No users found
                    </td>
                </tr>
            `;
            return;
        }

        // Update statistics
        document.getElementById('totalUsers').textContent = users.length;
        document.getElementById('verifiedUsers').textContent = 
            users.filter(user => user.verified).length;
        document.getElementById('activeUsers').textContent = 
            users.filter(user => {
                const lastLogin = new Date(user.last_login);
                const today = new Date();
                return lastLogin.toDateString() === today.toDateString();
            }).length;

        // Populate user table
        users.forEach(user => {
            const row = document.createElement('tr');
            row.className = 'hover:bg-gray-750 transition-colors';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div class="text-sm font-medium text-gray-300">${user.email}</div>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${user.verified ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                        ${user.verified ? 'Verified' : 'Pending'}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${new Date(user.created_at).toLocaleDateString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-300">
                    ${new Date(user.last_login).toLocaleString()}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    <button onclick="viewUserDetails('${user.email}')" 
                        class="inline-flex items-center px-3 py-1.5 bg-blue-600 hover:bg-blue-700 
                        text-white font-medium rounded-lg transition-colors duration-200">
                        View
                    </button>
                    <button onclick="toggleUserStatus('${user.email}', ${user.verified})" 
                        class="inline-flex items-center px-3 py-1.5 
                        ${user.verified ? 
                            'bg-red-600 hover:bg-red-700' : 
                            'bg-green-600 hover:bg-green-700'} 
                        text-white font-medium rounded-lg transition-colors duration-200">
                        ${user.verified ? 'Revoke' : 'Approve'}
                    </button>
                </td>
            `;
            userTableBody.appendChild(row);
        });

    } catch (error) {
        console.error('Error loading user list:', error);
        userTableBody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-4 text-center text-red-500">
                    Error loading users. Please try refreshing the page.
                </td>
            </tr>
        `;
    }
}

async function loadActivityLogs() {
    try {
        // Fetch recent user activities from Supabase
        const { data: logs, error } = await supabase
            .from('activity_logs')  // You'll need to create this table
            .select('*')
            .order('created_at', { ascending: false })
            .limit(10);

        if (error) throw error;

        const logsContainer = document.getElementById('activityLogs');
        logsContainer.innerHTML = '';

        logs.forEach(log => {
            const logEntry = document.createElement('div');
            logEntry.className = 'bg-gray-700 rounded-lg p-4';
            logEntry.innerHTML = `
                <div class="flex justify-between items-start">
                    <div>
                        <p class="text-gray-300">${log.email}</p>
                        <p class="text-sm text-gray-400">${log.action}</p>
                    </div>
                    <span class="text-sm text-gray-400">
                        ${new Date(log.created_at).toLocaleString()}
                    </span>
                </div>
            `;
            logsContainer.appendChild(logEntry);
        });
    } catch (error) {
        console.error('Error loading activity logs:', error);
    }
}

async function viewUserDetails(email) {
    try {
        const { data: user, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;

        // Show user details in a modal or detailed view
        alert(`
            User Details:
            Email: ${user.email}
            Status: ${user.verified ? 'Verified' : 'Pending'}
            Created: ${new Date(user.created_at).toLocaleString()}
            Last Login: ${new Date(user.last_login).toLocaleString()}
        `);
    } catch (error) {
        console.error('Error loading user details:', error);
    }
}

async function toggleUserStatus(email, currentStatus) {
    try {
        // Update user status in Supabase
        const { error: updateError } = await supabase
            .from('users')
            .update({ verified: !currentStatus })
            .eq('email', email);

        if (updateError) throw updateError;

        // Log the activity
        const { error: logError } = await supabase
            .from('activity_logs')
            .insert([{
                email: email,
                action: !currentStatus ? 'User Approved' : 'User Access Revoked',
                admin_email: sessionStorage.getItem('userEmail'),
                created_at: new Date().toISOString()
            }]);

        if (logError) throw logError;

        // Refresh the user list and activity logs
        await loadUserList();
        await loadActivityLogs();

        // Show success message
        alert(`User ${email} has been ${!currentStatus ? 'approved' : 'revoked'} successfully.`);
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Failed to update user status. Please try again.');
    }
}

async function logout() {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        
        sessionStorage.clear();
        window.location.href = 'index.html';
    } catch (error) {
        console.error('Error during logout:', error);
        sessionStorage.clear();
        window.location.href = 'index.html';
    }
}

// Make functions available globally
window.viewUserDetails = viewUserDetails;
window.toggleUserStatus = toggleUserStatus;
window.refreshUserList = loadUserList;
window.logout = logout;

export { loadUserList, loadActivityLogs, viewUserDetails, toggleUserStatus, logout }; 