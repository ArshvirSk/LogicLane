/**
 * Logger utility
 * Provides conditional logging based on environment
 * In production, only errors are logged, while in development all logs are shown
 */

const isDevelopment = import.meta.env.DEV;

export const logger = {
    log(...args) {
        if (isDevelopment) {
            console.log(...args);
        }
    },

    info(...args) {
        if (isDevelopment) {
            console.info(...args);
        }
    },

    warn(...args) {
        if (isDevelopment) {
            console.warn(...args);
        }
    },

    error(...args) {
        // Always log errors, even in production
        console.error(...args);
    },

    debug(...args) {
        if (isDevelopment) {
            console.debug(...args);
        }
    },

    table(data) {
        if (isDevelopment && console.table) {
            console.table(data);
        }
    }
};

export default logger;
