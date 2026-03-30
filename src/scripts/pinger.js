const https = require('node:https');
const http = require('node:http');

/**
 * TrustTrade High-Availability Pinger
 * This script pings the backend health endpoint to prevent Render from sleeping.
 * Uses ONLY built-in Node.js modules (no npm install required).
 * 
 * Usage: node src/scripts/pinger.js [URL] [INTERVAL_MS]
 */

const TARGET_URL = process.argv[2] || 'https://trusttrade-6d81.onrender.com/api/health';
const INTERVAL = parseInt(process.argv[3]) || 13 * 60 * 1000; // 13 minutes default

function ping() {
    console.log(`[${new Date().toISOString()}] Sending ping to: ${TARGET_URL}...`);
    
    const client = TARGET_URL.startsWith('https') ? https : http;

    const req = client.get(TARGET_URL, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
            console.log(`[${new Date().toISOString()}] Response: ${res.statusCode} ${data}`);
        });
    });

    req.on('error', (err) => {
        console.error(`[${new Date().toISOString()}] Ping error: ${err.message}`);
    });

    req.end();
}

// Initial ping
ping();

// Schedule repeated pings if running as a persistent process
if (process.argv.includes('--loop')) {
    console.log(`[KEEP-ALIVE] Loop mode active. Refreshing every ${INTERVAL / 1000 / 60} minutes.`);
    setInterval(ping, INTERVAL);
} else {
    console.log(`[INFO] Run with '--loop' to keep this script running persistently.`);
}
