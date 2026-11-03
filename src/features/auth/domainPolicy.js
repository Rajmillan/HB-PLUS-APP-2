"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAllowedEmail = isAllowedEmail;
exports.isEmailVerified = isEmailVerified;
exports.validateAuthorizedUser = validateAuthorizedUser;
const config_1 = require("../../constants/config");
/**
 * Validates if an email belongs to the authorized @hbplus.fit domain.
 *
 * Rules:
 * - Trims and lowercases the input.
 * - Requires exact suffix "@hbplus.fit".
 * - DOES NOT use String.prototype.includes() per strict assignment requirements.
 * - Ensures a valid local part exists prior to the domain.
 */
function isAllowedEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const normalized = email.trim().toLowerCase();
    // Guard against string just being the domain without a local part
    if (normalized.length <= config_1.ALLOWED_EMAIL_DOMAIN.length) {
        return false;
    }
    // Exact suffix check (NO includes() used)
    if (!normalized.endsWith(config_1.ALLOWED_EMAIL_DOMAIN)) {
        return false;
    }
    // Ensure valid local part before "@hbplus.fit"
    const localPart = normalized.slice(0, normalized.length - config_1.ALLOWED_EMAIL_DOMAIN.length);
    // Local part must be non-empty and cannot contain another '@'
    if (localPart.length === 0 || localPart.indexOf('@') !== -1) {
        return false;
    }
    return true;
}
/**
 * Validates whether the user's email address is verified by Supabase or Google OAuth.
 */
function isEmailVerified(user) {
    if (!user) {
        return false;
    }
    // Check Supabase email_confirmed_at timestamp
    if (Boolean(user.email_confirmed_at) || Boolean(user.confirmed_at)) {
        return true;
    }
    // Check OAuth provider claims in user_metadata
    if (user.user_metadata && user.user_metadata.email_verified === true) {
        return true;
    }
    return false;
}
/**
 * Comprehensive check for user authorization against the @hbplus.fit domain policy.
 * Rejects missing email, non-matching domain, or unverified email.
 */
function validateAuthorizedUser(user) {
    if (!user || !user.email) {
        return {
            isAuthorized: false,
            errorMessage: config_1.DOMAIN_RESTRICTION_MESSAGE,
        };
    }
    if (!isAllowedEmail(user.email)) {
        return {
            isAuthorized: false,
            errorMessage: config_1.DOMAIN_RESTRICTION_MESSAGE,
        };
    }
    if (!isEmailVerified(user)) {
        return {
            isAuthorized: false,
            errorMessage: config_1.DOMAIN_RESTRICTION_MESSAGE,
        };
    }
    return { isAuthorized: true };
}
