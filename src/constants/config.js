"use strict";
/**
 * Application Constants and Environment Configuration
 *
 * Security: Only public (EXPO_PUBLIC_) variables are used client-side.
 * Secret keys (e.g. Supabase service_role) must NEVER be referenced here.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AUTH_GENERIC_ERROR_MESSAGE = exports.AUTH_CANCELLED_MESSAGE = exports.DOMAIN_RESTRICTION_MESSAGE = exports.APP_SCHEME = exports.ALLOWED_EMAIL_DOMAIN = exports.IS_SUPABASE_CONFIGURED = exports.SUPABASE_ANON_KEY = exports.SUPABASE_URL = void 0;
exports.SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
exports.SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';
exports.IS_SUPABASE_CONFIGURED = Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL &&
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.EXPO_PUBLIC_SUPABASE_URL.includes('placeholder'));
/**
 * Domain policy constants
 * Only exact @hbplus.fit emails are permitted.
 */
exports.ALLOWED_EMAIL_DOMAIN = '@hbplus.fit';
/**
 * Deep link scheme for native OAuth redirection
 */
exports.APP_SCHEME = 'hbplus';
/**
 * Standard user-facing error messages
 */
exports.DOMAIN_RESTRICTION_MESSAGE = 'Access restricted. Please login using your official domain email.';
exports.AUTH_CANCELLED_MESSAGE = 'Google sign-in was cancelled.';
exports.AUTH_GENERIC_ERROR_MESSAGE = 'Unable to complete authentication. Please try again or contact your administrator.';
