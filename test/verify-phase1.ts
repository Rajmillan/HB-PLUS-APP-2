import { isAllowedEmail, isEmailVerified, validateAuthorizedUser } from '../src/features/auth/domainPolicy';

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

console.log('\n--- Running Domain Policy Verification Tests ---\n');

// 1. isAllowedEmail tests
assert(isAllowedEmail('john.doe@hbplus.fit') === true, 'Valid user@hbplus.fit allowed');
assert(isAllowedEmail('   JOHN.DOE@HBPLUS.FIT   ') === true, 'Uppercase and untrimmed valid email allowed');
assert(isAllowedEmail('admin+ops@hbplus.fit') === true, 'Sub-addressing/plus valid email allowed');
assert(isAllowedEmail('alex@gmail.com') === false, 'alex@gmail.com rejected');
assert(isAllowedEmail('alex@hbplus.fit.com') === false, 'user@hbplus.fit.com rejected');
assert(isAllowedEmail('alex@fakehbplus.fit') === false, 'user@fakehbplus.fit rejected');
assert(isAllowedEmail('@hbplus.fit') === false, 'Missing local part @hbplus.fit rejected');
assert(isAllowedEmail('hbplus.fit') === false, 'Raw domain without @ rejected');
assert(isAllowedEmail('evil@fake.com@hbplus.fit') === false, 'Multi-at spoofing attempt rejected');
assert(isAllowedEmail('') === false, 'Empty string rejected');
assert(isAllowedEmail(null) === false, 'Null rejected');
assert(isAllowedEmail(undefined) === false, 'Undefined rejected');

// Ensure includes() is NOT used in isAllowedEmail implementation
const fnString = isAllowedEmail.toString();
assert(!fnString.includes('.includes('), 'Strict compliance: isAllowedEmail does NOT use includes()');

// 2. isEmailVerified tests
assert(
  isEmailVerified({
    email_confirmed_at: '2026-11-03T00:00:00Z',
  }) === true,
  'Supabase email_confirmed_at verified'
);

assert(
  isEmailVerified({
    user_metadata: { email_verified: true },
  }) === true,
  'Google OAuth metadata email_verified verified'
);

assert(
  isEmailVerified({
    email_confirmed_at: undefined,
    confirmed_at: undefined,
    user_metadata: { email_verified: false },
  }) === false,
  'Unconfirmed email rejected'
);

assert(
  isEmailVerified(null) === false,
  'Null user is not verified'
);

// 3. validateAuthorizedUser comprehensive tests
const validUser: any = {
  id: 'usr_123',
  email: 'employee@hbplus.fit',
  email_confirmed_at: '2026-11-03T00:00:00Z',
};

const invalidDomainUser: any = {
  id: 'usr_456',
  email: 'employee@gmail.com',
  email_confirmed_at: '2026-11-03T00:00:00Z',
};

const unverifiedUser: any = {
  id: 'usr_789',
  email: 'employee@hbplus.fit',
  email_confirmed_at: undefined,
  confirmed_at: undefined,
  user_metadata: { email_verified: false },
};

assert(
  validateAuthorizedUser(validUser).isAuthorized === true,
  'Valid verified @hbplus.fit user passes'
);

const invalidDomainResult = validateAuthorizedUser(invalidDomainUser);
assert(
  invalidDomainResult.isAuthorized === false &&
    invalidDomainResult.errorMessage ===
      'Access restricted. Please login using your official domain email.',
  'Invalid domain rejected with exact required message'
);

const unverifiedResult = validateAuthorizedUser(unverifiedUser);
assert(
  unverifiedResult.isAuthorized === false &&
    unverifiedResult.errorMessage ===
      'Access restricted. Please login using your official domain email.',
  'Unverified email rejected with exact required message'
);

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.\n`);

if (passedTests !== totalTests) {
  process.exit(1);
}
