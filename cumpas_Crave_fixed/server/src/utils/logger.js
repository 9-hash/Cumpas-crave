/**
 * Minimal, dependency-free structured logger.
 *
 * Why not just console.log everywhere?
 *  - Every line gets a real timestamp and a level, so logs can be filtered/greped.
 *  - Errors and warnings are also mirrored to logs/app.log so they survive after
 *    a terminal / hosting dashboard scrolls them away.
 *  - Optional `meta` object lets callers attach structured context (userId,
 *    route, duration, etc.) without hand-building strings everywhere.
 *
 * Usage:
 *   const logger = require('../utils/logger');
 *   logger.info('User logged in', { userId: user.id, email: user.email });
 *   logger.warn('Failed login attempt', { email });
 *   logger.error('Order creation failed', { error: err.message });
 */

const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'app.log');

// Best-effort: don't crash the app if the filesystem is read-only (some hosts).
let fileLoggingEnabled = true;
try {
    if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
} catch (err) {
    fileLoggingEnabled = false;
    // eslint-disable-next-line no-console
    console.warn('⚠️  File logging disabled (could not create logs directory):', err.message);
}

const LEVELS = {
    debug: { label: 'DEBUG', console: 'log' },
    info: { label: 'INFO', console: 'log' },
    warn: { label: 'WARN', console: 'warn' },
    error: { label: 'ERROR', console: 'error' },
};

function format(level, message, meta) {
    const timestamp = new Date().toISOString();
    const metaStr = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level}] ${message}${metaStr}`;
}

function writeToFile(line) {
    if (!fileLoggingEnabled) return;
    try {
        fs.appendFile(LOG_FILE, line + '\n', () => {});
    } catch (_) {
        // Never let logging itself crash the request.
    }
}

function log(levelKey, message, meta = {}) {
    const level = LEVELS[levelKey] || LEVELS.info;
    const line = format(level.label, message, meta);
    // eslint-disable-next-line no-console
    console[level.console](line);
    writeToFile(line);
}

module.exports = {
    debug: (message, meta) => log('debug', message, meta),
    info: (message, meta) => log('info', message, meta),
    warn: (message, meta) => log('warn', message, meta),
    error: (message, meta) => log('error', message, meta),
};
