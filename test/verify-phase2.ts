import {
  isAllowedEmail,
  isEmailVerified,
  validateAuthorizedUser,
} from '../src/features/auth/domainPolicy';
import {
  checkIsAdmin,
  isValidRole,
  sanitizeProfileUpdate,
} from '../src/features/profile/roleUtils';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName}`);
  }
}

console.log('\n======================================================');
console.log('--- HBPLUS PHASE 2 AUTOMATED UNIT TEST SUITE ---');
console.log('======================================================\n');

// ---------------------------------------------------------------------------
// 1. DOMAIN POLICY: ALLOWED EMAILS
// ---------------------------------------------------------------------------
console.log('[1] Testing Allowed Emails & Exact Domain Suffix:');
assert(isAllowedEmail('alex@hbplus.fit') === true, 'Standard valid email allowed');
assert(isAllowedEmail('first.last@hbplus.fit') === true, 'Dotted local part allowed');
assert(isAllowedEmail('employee+filter@hbplus.fit') === true, 'Sub-addressed email allowed');

// ---------------------------------------------------------------------------
// 2. DOMAIN POLICY: UPPERCASE & WHITESPACE NORMALIZATION
// ---------------------------------------------------------------------------
console.log('\n[2] Testing Normalization (Uppercase & Whitespace):');
assert(isAllowedEmail('ALEX@HBPLUS.FIT') === true, 'All uppercase email normalized and allowed');
assert(isAllowedEmail('   alex@hbplus.fit   ') === true, 'Leading and trailing whitespace trimmed and allowed');
assert(isAllowedEmail('\t\n  ALEX.SMITH@HBPLUS.FIT  \n') === true, 'Tabs, newlines, and uppercase normalized and allowed');

// ---------------------------------------------------------------------------
// 3. DOMAIN POLICY: MISSING EMAIL INPUTS
// ---------------------------------------------------------------------------
console.log('\n[3] Testing Missing / Falsy Inputs:');
assert(isAllowedEmail('') === false, 'Empty string rejected');
assert(isAllowedEmail('   ') === false, 'Whitespace-only string rejected');
assert(isAllowedEmail(null) === false, 'null rejected');
assert(isAllowedEmail(undefined) === false, 'undefined rejected');
assert(isAllowedEmail(12345 as any) === false, 'Non-string numeric rejected');

// ---------------------------------------------------------------------------
// 4. DOMAIN POLICY: ATTACKER SUFFIX & SPOOFING ATTEMPTS
// ---------------------------------------------------------------------------
console.log('\n[4] Testing Attacker Suffix & Spoofing Injections:');
assert(isAllowedEmail('attacker@hbplus.fit.evil.com') === false, 'Trailing domain attacker.com rejected');
assert(isAllowedEmail('attacker@hbplus.fit.org') === false, 'Non-fit TLD rejected');
assert(isAllowedEmail('attacker@evil-hbplus.fit') === false, 'Hyphenated fake domain rejected');
assert(isAllowedEmail('attacker@fakehbplus.fit') === false, 'Prefix fake domain rejected');
assert(isAllowedEmail('attacker@sub.hbplus.fit') === false, 'Subdomain sub.hbplus.fit rejected');
assert(isAllowedEmail('attacker@hbplus.fit.') === false, 'Trailing dot rejected');
assert(isAllowedEmail('@hbplus.fit') === false, 'Missing local part rejected');
assert(isAllowedEmail('  @hbplus.fit  ') === false, 'Whitespace missing local part rejected');
assert(isAllowedEmail('hbplus.fit') === false, 'Bare domain without @ rejected');
assert(isAllowedEmail('spoof@target.com@hbplus.fit') === false, 'Double @ injection rejected');

// ---------------------------------------------------------------------------
// 5. DOMAIN POLICY: UNRELATED GMAIL & COMMON CONSUMER DOMAINS
// ---------------------------------------------------------------------------
console.log('\n[5] Testing Unrelated Gmail & External Providers:');
assert(isAllowedEmail('user@gmail.com') === false, 'Gmail consumer email rejected');
assert(isAllowedEmail('user.name@yahoo.com') === false, 'Yahoo consumer email rejected');
assert(isAllowedEmail('corp@outlook.com') === false, 'Outlook consumer email rejected');
assert(isAllowedEmail('admin@hbplus.com') === false, '.com instead of .fit rejected');

// ---------------------------------------------------------------------------
// 6. STRICT COMPLIANCE: NO String.prototype.includes()
// ---------------------------------------------------------------------------
console.log('\n[6] Testing Strict Prohibition of String.prototype.includes():');
const fnCode = isAllowedEmail.toString();
assert(!fnCode.includes('.includes('), 'isAllowedEmail does NOT invoke .includes()');

// ---------------------------------------------------------------------------
// 7. EMAIL VERIFICATION & AUTHORIZED USER VALIDATION
// ---------------------------------------------------------------------------
console.log('\n[7] Testing Email Verification & Rejection Handlers:');
assert(
  isEmailVerified({ email_confirmed_at: '2026-11-03T00:00:00Z' }) === true,
  'Supabase email_confirmed_at recognized as verified'
);
assert(
  isEmailVerified({ user_metadata: { email_verified: true } }) === true,
  'Google OAuth claim email_verified recognized'
);
assert(
  isEmailVerified({ email_confirmed_at: undefined, user_metadata: { email_verified: false } }) === false,
  'Unverified email detected and rejected'
);

const validHbUser: any = {
  id: 'usr_valid_01',
  email: 'verified.employee@hbplus.fit',
  email_confirmed_at: '2026-11-03T00:00:00Z',
};
assert(validateAuthorizedUser(validHbUser).isAuthorized === true, 'Verified corporate user authorized');

const gmailUser: any = {
  id: 'usr_gmail_02',
  email: 'external@gmail.com',
  email_confirmed_at: '2026-11-03T00:00:00Z',
};
const gmailResult = validateAuthorizedUser(gmailUser);
assert(
  gmailResult.isAuthorized === false &&
    gmailResult.errorMessage === 'Access restricted. Please login using your official domain email.',
  'Gmail user rejected with exact required domain restriction message'
);

const unverifiedHbUser: any = {
  id: 'usr_unverified_03',
  email: 'pending@hbplus.fit',
  email_confirmed_at: undefined,
  user_metadata: { email_verified: false },
};
const unverifiedResult = validateAuthorizedUser(unverifiedHbUser);
assert(
  unverifiedResult.isAuthorized === false &&
    unverifiedResult.errorMessage === 'Access restricted. Please login using your official domain email.',
  'Unverified account rejected with exact required domain restriction message'
);

// ---------------------------------------------------------------------------
// 8. PROFILE & ROLE UTILITIES (PHASE 2)
// ---------------------------------------------------------------------------
console.log('\n[8] Testing Profile & Role Utilities:');
assert(isValidRole('admin') === true, 'admin is a valid role');
assert(isValidRole('user') === true, 'user is a valid role');
assert(isValidRole('superadmin') === false, 'superadmin is not a recognized role');
assert(isValidRole(null) === false, 'null is not a valid role');
assert(isValidRole('') === false, 'empty string is not a valid role');

assert(checkIsAdmin('admin') === true, 'checkIsAdmin("admin") returns true');
assert(checkIsAdmin('user') === false, 'checkIsAdmin("user") returns false');
assert(checkIsAdmin('administrator') === false, 'checkIsAdmin("administrator") returns false');
assert(checkIsAdmin(undefined) === false, 'checkIsAdmin(undefined) returns false');

// Client-side payload sanitization (defense-in-depth against role tampering)
const maliciousClientPayload = {
  full_name: ' John Doe ',
  avatar_url: 'https://example.com/photo.jpg',
  role: 'admin', // Malicious attempt to escalate role
  id: 'other-user-uuid', // Malicious attempt to target another user
  email: 'spoofed@evil.com',
};
const sanitized = sanitizeProfileUpdate(maliciousClientPayload);

assert(sanitized.full_name === 'John Doe', 'Display name trimmed and preserved');
assert(sanitized.avatar_url === 'https://example.com/photo.jpg', 'Avatar URL preserved');
assert(!('role' in sanitized), 'Privileged field "role" stripped from client update payload');
assert(!('id' in sanitized), 'Immutable field "id" stripped from client update payload');
assert(!('email' in sanitized), 'Immutable field "email" stripped from client update payload');

console.log(`\n======================================================`);
console.log(`TEST RESULTS: ${passedTests}/${totalTests} tests passed.`);
console.log(`======================================================\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
