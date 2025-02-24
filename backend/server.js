const express = require('express');
const cors = require('cors');
const fs = require('fs').promises;
const path = require('path');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the frontend directory
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// Serve other HTML files
app.get('/admin-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/admin-dashboard.html'));
});

app.get('/user-dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/user-dashboard.html'));
});

// Helper function to read JSON files
async function readJSONFile(filename) {
    const data = await fs.readFile(path.join(__dirname, filename), 'utf8');
    return JSON.parse(data);
}

// Helper function to write JSON files
async function writeJSONFile(filename, data) {
    await fs.writeFile(
        path.join(__dirname, filename),
        JSON.stringify(data, null, 2),
        'utf8'
    );
}

// Check email endpoint
app.post('/api/check-email', async (req, res) => {
    try {
        const { email } = req.body;
        const admins = await readJSONFile('admins.json');
        const users = await readJSONFile('users.json');

        // Check if email exists in admins
        const admin = admins.admins.find(a => a.email === email);
        if (admin) {
            return res.json({
                success: true,
                userType: 'admin',
                verified: admin.verified
            });
        }

        // Check if email exists in users
        const user = users.users.find(u => u.email === email);
        if (user) {
            return res.json({
                success: true,
                userType: 'user',
                verified: user.verified
            });
        }

        res.json({ success: false });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Generate QR code endpoint
app.post('/api/generate-qr', async (req, res) => {
    try {
        const { email, userType } = req.body;
        const filename = userType === 'admin' ? 'admins.json' : 'users.json';
        const data = await readJSONFile(filename);
        
        const users = data[userType === 'admin' ? 'admins' : 'users'];
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Create the otpauth URL
        const otpauthUrl = speakeasy.otpauthURL({
            secret: user.secret,
            label: encodeURIComponent(email),
            issuer: 'PASS-KEY',
            encoding: 'base32'
        });

        // Generate QR code from the otpauth URL
        const qrCode = await QRCode.toDataURL(otpauthUrl);

        res.json({
            success: true,
            secret: user.secret,
            qrCode: qrCode
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Verify token endpoint
app.post('/api/verify-token', async (req, res) => {
    try {
        const { email, token, userType } = req.body;
        const filename = userType === 'admin' ? 'admins.json' : 'users.json';
        const data = await readJSONFile(filename);
        
        const users = data[userType === 'admin' ? 'admins' : 'users'];
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Verify TOTP token
        const verified = speakeasy.totp.verify({
            secret: user.secret,
            encoding: 'base32',
            token: token,
            window: 1 // Allow 1 step before and after current time
        });

        if (verified) {
            // Update user verification status and last login
            user.verified = true;
            user.lastLogin = new Date().toISOString();
            await writeJSONFile(filename, data);

            res.json({
                success: true,
                userData: {
                    email: user.email,
                    lastLogin: user.lastLogin
                }
            });
        } else {
            res.json({ success: false, message: 'Invalid verification code' });
        }
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get user data endpoint
app.post('/api/user-data', async (req, res) => {
    try {
        const { email } = req.body;
        const users = await readJSONFile('users.json');
        const user = users.users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({
            success: true,
            userData: {
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get admin data endpoint
app.post('/api/admin-data', async (req, res) => {
    try {
        const { email } = req.body;
        const admins = await readJSONFile('admins.json');
        const users = await readJSONFile('users.json');
        const admin = admins.admins.find(a => a.email === email);

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' });
        }

        // Calculate stats
        const totalUsers = users.users.length;
        const activeUsers = users.users.filter(u => {
            const lastLogin = new Date(u.lastLogin);
            const today = new Date();
            return lastLogin.toDateString() === today.toDateString();
        }).length;

        res.json({
            success: true,
            adminData: {
                email: admin.email,
                lastLogin: admin.lastLogin
            },
            stats: {
                totalUsers,
                activeUsers
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
