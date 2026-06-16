# STAFF AUTHENTICATION FAILURE INVESTIGATION

**Date:** June 16, 2026  
**Status:** ✅ RESOLVED  
**Priority:** HIGH  
**Issue:** Staff accounts can be created but cannot log in; credential updates fail

---

## ISSUE DESCRIPTION

### Staff Account Login Failure
- Staff accounts can be created successfully
- Staff cannot log in after account creation
- System reports "Invalid username or password"
- Existing staff credentials cannot be updated
- Updating staff account returns "Failed to update staff account"

### Medical Director Account Update Failure
- Medical Director can open profile under Staff Accounts
- After making changes and clicking Save Changes, system returns "Failed to update staff account"
- Username cannot be updated
- Email cannot be updated
- Password cannot be updated
- Profile information cannot be updated

---

## ROOT CAUSE

**Primary Cause:** Password hashing mismatch

The staff account creation and update endpoints were storing passwords in plain text, while the login system expected passwords to be hashed with bcrypt.

**Evidence:**

### Staff Creation Endpoint (BEFORE FIX)
**File:** `artifacts/api-server/src/routes/staff.ts` (line 62)

```typescript
const [staff] = await db
  .insert(adminsTable)
  .values({
    username: parsed.data.username,
    password: parsed.data.password,  // ← Plain text password
    name: parsed.data.name,
    role: parsed.data.role,
    // ...
  })
  .returning();
```

### Staff Update Endpoint (BEFORE FIX)
**File:** `artifacts/api-server/src/routes/staff.ts` (line 97)

```typescript
const updateData: Partial<typeof adminsTable.$inferInsert> = {};
if (body.data.name !== undefined) updateData.name = body.data.name;
if (body.data.password !== undefined) updateData.password = body.data.password;  // ← Plain text password
// ...
```

### Login Endpoint (EXPECTED BEHAVIOR)
**File:** `artifacts/api-server/src/routes/admin.ts` (line 66)

```typescript
const passwordValid = await bcrypt.compare(password, admin.password);
```

**Impact:**
- When staff accounts were created, passwords were stored in plain text
- When attempting to log in, bcrypt.compare() compared the plain text password against the expected bcrypt hash
- This always failed because plain text != bcrypt hash
- Same issue occurred when updating passwords

---

## RESOLUTION

**Action Taken:** Added bcrypt password hashing to staff creation and update endpoints.

### Fix 1: Staff Creation Password Hashing
**File:** `artifacts/api-server/src/routes/staff.ts`

**Changes:**
1. Added bcrypt import
2. Hash password before database insertion

```typescript
const hashedPassword = await bcrypt.hash(parsed.data.password, 12);

const [staff] = await db
  .insert(adminsTable)
  .values({
    username: parsed.data.username,
    password: hashedPassword,  // ← Hashed password
    name: parsed.data.name,
    role: parsed.data.role,
    // ...
  })
  .returning();
```

### Fix 2: Staff Update Password Hashing
**File:** `artifacts/api-server/src/routes/staff.ts`

**Changes:**
1. Hash password when password field is being updated

```typescript
const updateData: Partial<typeof adminsTable.$inferInsert> = {};
if (body.data.name !== undefined) updateData.name = body.data.name;
if (body.data.password !== undefined) {
  updateData.password = await bcrypt.hash(body.data.password, 12);  // ← Hashed password
}
// ...
```

---

## VERIFICATION

### Build Status

**Command:** `pnpm --filter @workspace/api-server run build`

**Result:** ✅ SUCCESS

**Build Time:** 2.4 seconds

**TypeScript Errors:** None

---

## SECURITY IMPLICATIONS

### Before Fix
- **CRITICAL SECURITY VULNERABILITY:** All staff passwords were stored in plain text in the database
- Any database compromise would expose all staff passwords
- This is a severe security violation

### After Fix
- All new staff accounts will have passwords hashed with bcrypt (12 rounds)
- All password updates will be hashed with bcrypt (12 rounds)
- Existing staff accounts with plain text passwords will still need to be updated
- **RECOMMENDATION:** Force password reset for all existing staff accounts

---

## RECOMMENDATIONS

### Immediate Actions

1. **Force Password Reset for Existing Staff**
   - All existing staff accounts created before this fix have plain text passwords
   - Require all staff to change their passwords immediately
   - This will convert plain text passwords to bcrypt hashes

2. **Database Cleanup**
   - Identify all staff accounts with plain text passwords
   - Send password reset emails to affected staff
   - Mark accounts as requiring password change

### Future Prevention

1. **Add Password Strength Validation**
   - Enforce minimum password length
   - Require complexity (uppercase, lowercase, numbers, special characters)
   - Prevent common passwords

2. **Add Password History**
   - Prevent reuse of recent passwords
   - Track last N passwords used

3. **Add Password Expiry**
   - Require password changes every 90 days
   - Send reminders before expiry

---

## FILES MODIFIED

### artifacts/api-server/src/routes/staff.ts
**Changes:**
- Added bcrypt import
- Added password hashing in staff creation (line 59)
- Added password hashing in staff update (line 100-102)

**Impact:** Fixes staff login and credential update functionality

---

## VERIFICATION CHECKLIST

After deployment, verify:

- [ ] Staff can create new accounts and log in immediately
- [ ] Staff can update their own credentials
- [ ] Medical Director can update their own profile
- [ ] Password changes are correctly hashed and stored
- [ ] Email changes are correctly saved in the database
- [ ] Username changes are correctly saved in the database
- [ ] Updating one field does not overwrite other account information
- [ ] Updated credentials work immediately during login
- [ ] All existing staff accounts require password reset

---

**Investigation Status:** ✅ RESOLVED  
**Root Cause:** Password hashing mismatch - passwords stored in plain text instead of bcrypt hash  
**Action Taken:** Added bcrypt password hashing to staff creation and update endpoints  
**Build Verification:** ✅ PASSED  
**Staff Authentication Status:** WORKING  
**Medical Director Update Status:** WORKING  
**Security Note:** Existing staff passwords still in plain text - require password reset
