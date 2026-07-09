const logger = require('../utils/logger');

/**
 * Logs every incoming HTTP request once it finishes, with method, path,
 * status code, response time, and (if authenticated) the acting user.
 *
 * Placed before the routes so it wraps every request; reads req.user
 * from the `finish` event, by which point requireAuth (if used on that
 * route) has already run and attached it.
 */
const requestLogger = (req, res, next) => {
    const start = process.hrtime.bigint();

    res.on('finish', () => {
        const durationMs = Number(process.hrtime.bigint() - start) / 1e6;
        const meta = {
            method: req.method,
            path: req.originalUrl,
            status: res.statusCode,
            durationMs: Math.round(durationMs),
            ip: req.ip,
        };
        if (req.user?.id) meta.userId = req.user.id;

        const message = `${req.method} ${req.originalUrl} ${res.statusCode}`;
        if (res.statusCode >= 500) {
            logger.error(message, meta);
        } else if (res.statusCode >= 400) {
            logger.warn(message, meta);
        } else {
            logger.info(message, meta);
        }
    });

    next();
};

module.exports = requestLogger;
