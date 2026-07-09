const { Pool } = require('pg');

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set!');
    process.exit(1);
}

// Hosted Postgres providers (Render, Neon, Supabase, etc.) require SSL.
// A local Postgres instance (localhost/127.0.0.1) almost never has SSL configured,
// so we auto-detect and disable it in that case instead of forcing a manual flag.
const isLocalDb = /localhost|127\.0\.0\.1/.test(connectionString);
const useSSL = process.env.PGSSL === 'true'
    ? { rejectUnauthorized: false }
    : process.env.PGSSL === 'false'
        ? false
        : (isLocalDb ? false : { rejectUnauthorized: false });

const pool = new Pool({
    connectionString,
    ssl: useSSL,
    connectionTimeoutMillis: 8000,
});

pool.on('connect', () => {
    console.log(`✅ Connected to PostgreSQL database ${isLocalDb ? '(local)' : '(remote, SSL)'}`);
});

pool.on('error', (err) => {
    console.error('❌ Database error:', err);
});

module.exports = pool;
