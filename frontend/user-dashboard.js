import { createClient } from '@supabase/supabase-js';
import config from './config.js';

// Initialize Supabase client
const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

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
        // Use Supabase to fetch user data
        const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('email', email)
            .single();

        if (error) throw error;

        if (userData) {
            document.getElementById('userEmail').textContent = userData.email;
            document.getElementById('lastLoginTime').textContent = 
                new Date(userData.last_login).toLocaleString();
        }
    } catch (error) {
        console.error('Error loading user data:', error);
    }
});

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

export { logout }; 