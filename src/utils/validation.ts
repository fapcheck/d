/**
 * Input validation utilities for user inputs across the application.
 */

/**
 * Validate and sanitize a string input
 * @returns Trimmed string or null if invalid
 */
export function validateNonEmptyString(input: string): string | null {
    const trimmed = input.trim();
    return trimmed.length > 0 ? trimmed : null;
}

/**
 * Validate a URL string
 * @returns true if valid URL format
 */
export function isValidUrl(input: string): boolean {
    try {
        const url = new URL(input);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
        return false;
    }
}

/**
 * Validate domain/hostname (for DMCA sites/hostings)
 * Accepts both full URLs and domain names
 */
export function validateDomain(input: string): string | null {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Try as URL first
    if (isValidUrl(trimmed)) {
        try {
            return new URL(trimmed).hostname;
        } catch {
            return null;
        }
    }

    // Try as domain name (simple validation)
    // Allow letters, numbers, dots, hyphens
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9]$/;
    if (domainRegex.test(trimmed) && trimmed.includes('.')) {
        return trimmed.toLowerCase();
    }

    return null;
}

/**
 * Sanitize text input by removing extra whitespace
 */
export function sanitizeText(input: string): string {
    return input
        .trim()
        .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Validate email address
 */
export function isValidEmail(input: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(input.trim());
}
