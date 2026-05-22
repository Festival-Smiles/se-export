const express = require('express');
const axios = require('axios');
const path = require('path');
const rateLimit = require('express-rate-limit');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

// --- 🛡️ RATE LIMITER ---
// Protects the server from API spam and bandwidth abuse
const exportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 export requests per window
    message: `
        <div style="font-family: sans-serif; background: #1a1a1a; color: white; padding: 40px; text-align: center; border-top: 4px solid #f39c12;">
            <h2 style="color: #f39c12;">Whoa there, speedster!</h2>
            <p>You have requested too many exports recently. Please wait 15 minutes before trying again.</p>
            <a href="/" style="color: #5dade2;">← Go Back</a>
        </div>
    `,
    standardHeaders: true, 
    legacyHeaders: false, 
});

// Middleware to parse form data and serve the static HTML folder
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/export', (req, res) => {
    res.redirect('/');
});

// --- 📥 THE EXPORT ENDPOINT ---
app.post('/api/export', exportLimiter, async (req, res) => {
    const { channelId, jwtToken } = req.body;

    if (!channelId || !jwtToken) {
        res.setHeader('Content-Type', 'text/html');
        return res.status(400).send(`
            <div style="font-family: sans-serif; background: #1a1a1a; color: white; padding: 40px; text-align: center;">
                <h2 style="color: #e74c3c;">Bad Request</h2>
                <p>Form submission was empty or corrupted.</p>
                <a href="/" style="color: #5dade2;">← Go Back</a>
            </div>
        `);
    }

    // Set headers to trigger the CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="se_leaderboard_${channelId.trim()}.csv"`);

    // Master dictionary to hold combined user data
    const masterUserList = {}; 
    const limit = 100;

    try {
        // --- STEP 1: FETCH POINTS LEADERBOARD ---
        let offset = 0;
        let keepFetching = true;

        while (keepFetching) {
            const response = await axios.get(`https://api.streamelements.com/kappa/v2/points/${channelId.trim()}/top`, {
                params: { limit: limit, offset: offset },
                headers: { 'Authorization': `Bearer ${jwtToken.trim()}` }
            });

            const users = response.data.users;

            if (!users || users.length === 0) {
                keepFetching = false;
                break;
            }

            for (const user of users) {
                const username = user.username.toLowerCase().trim();
                const points = parseInt(user.points) || 0;
                
                // Initialize user if they don't exist in the dictionary yet
                if (!masterUserList[username]) {
                    masterUserList[username] = { points: 0, minutes: 0 };
                }
                
                masterUserList[username].points = points;
            }

            offset += limit;
            await new Promise(resolve => setTimeout(resolve, 300)); // Rate limit safety
        }

        // --- STEP 2: FETCH WATCHTIME LEADERBOARD ---
        offset = 0; // Reset offset for the new endpoint
        keepFetching = true;

        while (keepFetching) {
            // Note the endpoint change to /watchtime
            const response = await axios.get(`https://api.streamelements.com/kappa/v2/points/${channelId.trim()}/watchtime`, {
                params: { limit: limit, offset: offset },
                headers: { 'Authorization': `Bearer ${jwtToken.trim()}` }
            });

            const users = response.data.users;

            if (!users || users.length === 0) {
                keepFetching = false;
                break;
            }

            for (const user of users) {
                const username = user.username.toLowerCase().trim();
                const minutes = parseInt(user.minutes) || 0;
                
                // Initialize user if they weren't on the points leaderboard
                if (!masterUserList[username]) {
                    masterUserList[username] = { points: 0, minutes: 0 };
                }
                
                masterUserList[username].minutes = minutes;
            }

            offset += limit;
            await new Promise(resolve => setTimeout(resolve, 300));
        }

        // --- STEP 3: ASSEMBLE THE FINAL CSV ---
        let csvData = "Username,Points,Watchtime (Minutes)\n"; 

        // Loop through the master dictionary
        for (const [username, stats] of Object.entries(masterUserList)) {
            // Only add the user to the CSV if they have more than 0 points OR more than 0 minutes
            if (stats.points > 0 || stats.minutes > 0) {
                csvData += `"${username}",${stats.points},${stats.minutes}\n`;
            }
        }

        // Send the completed file to the browser
        res.send(csvData);

    } catch (err) {
        console.error("Export Error:", err.message);
        res.setHeader('Content-Type', 'text/html');
        res.status(500).send(`
            <div style="font-family: sans-serif; background: #1a1a1a; color: white; padding: 40px; text-align: center; border-top: 4px solid #e74c3c;">
                <h2 style="color: #e74c3c;">Connection Failed</h2>
                <p>Double check your Channel ID and JWT token. The StreamElements API rejected the connection.</p>
                <a href="/" style="color: #5dade2;">← Try Again</a>
            </div>
        `);
    }
});

// Explicit interface binding for cloud container proxies
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Secure SE Exporter running on port ${PORT}`);
});
