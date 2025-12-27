/**
 * Validation utilities for user data
 */

/**
 * Validate CURP format (18 characters)
 * Format: AAAA######HAAAAA##
 */
function isValidCURP(curp) {
    if (!curp || typeof curp !== 'string') return false;

    const curpRegex = /^[A-Z]{4}\d{6}[HM][A-Z]{5}[A-Z0-9]\d$/;
    return curpRegex.test(curp.toUpperCase());
}

/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') return false;

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Mexican phone number
 * Accepts: 10 digits, can start with optional country code
 */
function isValidPhone(phone) {
    if (!phone || typeof phone !== 'string') return false;

    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Accept 10 digits or 12 digits (with country code +52)
    const phoneRegex = /^(\+?52)?[1-9]\d{9}$/;
    return phoneRegex.test(cleaned);
}

/**
 * Validate CLABE (Mexican bank account number - 18 digits)
 */
function isValidCLABE(clabe) {
    if (!clabe || typeof clabe !== 'string') return false;

    const cleaned = clabe.replace(/\s/g, '');

    // Must be exactly 18 digits
    if (!/^\d{18}$/.test(cleaned)) return false;

    // Luhn algorithm validation for CLABE
    const digits = cleaned.split('').map(Number);
    const weights = [3, 7, 1];
    let sum = 0;

    for (let i = 0; i < 17; i++) {
        sum += (digits[i] * weights[i % 3]) % 10;
    }

    const checkDigit = (10 - (sum % 10)) % 10;
    return checkDigit === digits[17];
}

/**
 * Validate password strength
 * At least 8 characters, 1 uppercase, 1 lowercase, 1 number
 */
function isValidPassword(password) {
    if (!password || typeof password !== 'string') return false;

    if (password.length < 8) return false;

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);

    return hasUpperCase && hasLowerCase && hasNumber;
}

/**
 * Normalize phone number to standard format
 */
function normalizePhone(phone) {
    if (!phone) return '';

    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');

    // If starts with 52, remove it (country code)
    if (cleaned.startsWith('52') && cleaned.length === 12) {
        return cleaned.substring(2);
    }

    return cleaned;
}

/**
 * Validate document expiry date (not expired)
 */
function isDocumentValid(expiryDate) {
    if (!expiryDate) return true; // If no date, assume valid

    const expiry = new Date(expiryDate);
    const today = new Date();

    return expiry > today;
}

module.exports = {
    isValidCURP,
    isValidEmail,
    isValidPhone,
    isValidCLABE,
    isValidPassword,
    normalizePhone,
    isDocumentValid
};
