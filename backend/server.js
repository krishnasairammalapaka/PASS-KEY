const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs').promises;
const path = require('path');

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
}));
app.use(bodyParser.json());

// Update static file serving
app.use(express.static(path.join(__dirname, '../frontend')));

// Update route handlers - add these before other routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dashboard.html'));
});

app.get('/totp', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/totp.html'));
});

// Add catch-all route for undefined routes
app.get('*', (req, res) => {
    res.redirect('/');
});

const USERS_FILE = path.join(__dirname, 'users.json');

// Helper function to read users
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data).users;
    } catch (error) {
        return [];
    }
}

// Helper function to write users
async function writeUsers(users) {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2));
}

// Update the register endpoint to always return QR code for unverified users
app.post('/api/register', async (req, res) => {
    try {
        const { email } = req.body;
        const users = await readUsers();
        let user = users.find(u => u.email === email);
        
        if (!user) {
            // Generate secret with correct parameters for Microsoft Authenticator
            const secret = speakeasy.generateSecret({
                length: 20,
                name: email,
                issuer: 'PASS-KEY'
            });

            // Create a properly formatted otpauth URL
            const otpauthUrl = `otpauth://totp/${encodeURIComponent('PASS-KEY')}:${encodeURIComponent(email)}?secret=${secret.base32}&issuer=${encodeURIComponent('PASS-KEY')}&algorithm=SHA1&digits=6&period=30`;

            user = {
                email,
                secret: secret.base32,
                verified: false,
                createdAt: new Date().toISOString()
            };

            users.push(user);
            await writeUsers(users);

            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
            
            console.log('Generated secret:', secret.base32); // For debugging
            console.log('OTPAuth URL:', otpauthUrl); // For debugging

            res.json({
                success: true,
                verified: false,
                qrCode: qrCodeUrl,
                secret: secret.base32,
                otpauthUrl // For debugging
            });
        } else if (!user.verified) {
            // Handle existing unverified user
            const otpauthUrl = `otpauth://totp/${encodeURIComponent('PASS-KEY')}:${encodeURIComponent(email)}?secret=${user.secret}&issuer=${encodeURIComponent('PASS-KEY')}&algorithm=SHA1&digits=6&period=30`;
            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
            
            res.json({
                success: true,
                verified: false,
                qrCode: qrCodeUrl,
                secret: user.secret,
                otpauthUrl // For debugging
            });
        } else {
            // For verified users, just return success with verified status
            res.json({
                success: true,
                verified: true,
                message: 'Please enter your authentication code'
            });
        }
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server error',
            error: error.message 
        });
    }
});

// Add a new endpoint to get QR code for existing users
app.post('/api/get-qr', async (req, res) => {
    try {
        const { email } = req.body;
        const users = await readUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (!user.verified) {
            const otpauthUrl = speakeasy.otpauthURL({
                secret: user.secret,
                label: encodeURIComponent(email),
                issuer: 'PASS-KEY',
                algorithm: 'sha1'
            });

            const qrCodeUrl = await QRCode.toDataURL(otpauthUrl);
            res.json({
                success: true,
                qrCode: qrCodeUrl,
                secret: user.secret,
                otpauthUrl: otpauthUrl
            });
        } else {
            res.json({
                success: true,
                verified: true
            });
        }
    } catch (error) {
        console.error('QR Code generation error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// Update the verify endpoint
app.post('/api/verify', async (req, res) => {
    try {
        const { email, token } = req.body;
        
        console.log('Verifying token:', { email, token }); // For debugging
        
        const users = await readUsers();
        const user = users.find(u => u.email === email);

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        console.log('User secret:', user.secret); // For debugging

        // Verify TOTP with more specific parameters
        const verified = speakeasy.totp.verify({
            secret: user.secret,
            encoding: 'base32',
            token: token.toString(), // Convert token to string
            window: 2, // Allow 2 intervals before/after for time drift
            step: 30, // 30-second steps
            digits: 6 // 6-digit tokens
        });

        console.log('Verification result:', verified); // For debugging

        if (verified) {
            user.verified = true;
            user.lastLogin = new Date().toISOString();
            await writeUsers(users);
            
            res.json({ 
                success: true,
                message: 'Authentication successful',
                userData: {
                    email: user.email,
                    lastLogin: user.lastLogin
                },
                redirectUrl: '/dashboard.html'  // Add redirect URL to response
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid authentication code',
                debug: {
                    providedToken: token,
                    expectedLength: 6,
                    timeWindow: 'Current time ±60 seconds'
                }
            });
        }
    } catch (error) {
        console.error('Verification error:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Verification error',
            error: error.message
        });
    }
});

// Add endpoint to get user data
app.post('/api/user-data', async (req, res) => {
    const { email } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (user && user.verified) {
        res.json({
            success: true,
            userData: {
                email: user.email,
                lastLogin: user.lastLogin
            }
        });
    } else {
        res.status(401).json({ 
            success: false,
            message: 'Unauthorized access'
        });
    }
});

app.post('/api/validate-session', async (req, res) => {
    const { email } = req.body;
    const users = await readUsers();
    const user = users.find(u => u.email === email);

    if (user && user.verified) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
