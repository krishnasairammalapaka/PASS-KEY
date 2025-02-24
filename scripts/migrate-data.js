require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs').promises;

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function migrateData() {
    try {
        // Read JSON files
        const usersData = JSON.parse(await fs.readFile('./backend/users.json', 'utf8'));
        const adminsData = JSON.parse(await fs.readFile('./backend/admins.json', 'utf8'));

        // Migrate users
        const { error: usersError } = await supabase
            .from('users')
            .insert(usersData.users.map(user => ({
                email: user.email,
                secret: user.secret,
                verified: user.verified,
                created_at: user.createdAt,
                last_login: user.lastLogin
            })));

        if (usersError) throw usersError;

        // Migrate admins
        const { error: adminsError } = await supabase
            .from('admins')
            .insert(adminsData.admins.map(admin => ({
                email: admin.email,
                secret: admin.secret,
                verified: admin.verified,
                created_at: admin.createdAt,
                last_login: admin.lastLogin,
                role: admin.role
            })));

        if (adminsError) throw adminsError;

        console.log('Data migration completed successfully');
    } catch (error) {
        console.error('Error migrating data:', error);
    }
}

migrateData(); 