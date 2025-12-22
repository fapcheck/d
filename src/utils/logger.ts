/**
 * Centralized error logging and user notification system.
 * Replaces console.error calls throughout the application.
 */

export type LogLevel = 'error' | 'warn' | 'info';

interface LogEntry {
    level: LogLevel;
    message: string;
    error?: Error;
    timestamp: number;
}

// Check if we're in development mode
const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

class Logger {
    private logs: LogEntry[] = [];
    private maxLogs = 100; // Keep last 100 logs

    /**
     * Log an error with optional Error object
     */
    error(message: string, error?: Error): void {
        this.log('error', message, error);

        // In development, also log to console
        if (isDevelopment) {
            console.error(`[ERROR] ${message}`, error || '');
        }
    }

    /**
     * Log a warning
     */
    warn(message: string, error?: Error): void {
        this.log('warn', message, error);

        if (isDevelopment) {
            console.warn(`[WARN] ${message}`, error || '');
        }
    }

    /**
     * Log informational message
     */
    info(message: string): void {
        this.log('info', message);

        if (isDevelopment) {
            console.log(`[INFO] ${message}`);
        }
    }

    private log(level: LogLevel, message: string, error?: Error): void {
        this.logs.push({
            level,
            message,
            error,
            timestamp: Date.now()
        });

        // Keep only last N logs
        if (this.logs.length > this.maxLogs) {
            this.logs = this.logs.slice(-this.maxLogs);
        }

        // TODO: Send to error tracking service in production
        // if (!isDevelopment) {
        //     sendToErrorTracking({ level, message, error });
        // }
    }

    /**
     * Get recent logs for debugging
     */
    getRecentLogs(count: number = 10): LogEntry[] {
        return this.logs.slice(-count);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
    }
}

// Singleton instance
export const logger = new Logger();
