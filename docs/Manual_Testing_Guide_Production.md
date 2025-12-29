# Manual Testing Guide - Production Environment
## RAG Prompt Library - Critical User Flow Testing

**Production URL**: https://rag-prompt-library.web.app  
**Purpose**: Step-by-step manual testing guide for verifying critical user flows  
**Target Audience**: QA Engineers, Developers, Product Managers

---

## 🎯 Overview

This guide provides detailed instructions for manually testing all critical user flows in the production environment. Follow each section sequentially and document results.

**Testing Prerequisites**:
- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Valid email address for testing
- Google account for OAuth testing (optional)
- Browser DevTools knowledge (for technical checks)
- Access to Firebase Console (for backend verification)

---

## 📋 Test Execution Checklist

### Pre-Testing Setup
- [ ] Clear browser cache and cookies
- [ ] Open browser DevTools (F12)
- [ ] Open Console tab to monitor errors
- [ ] Open Network tab to monitor requests
- [ ] Have Firebase Console open in another tab
- [ ] Prepare test data (email, passwords, etc.)

---

## 1️⃣ Authentication Flow Testing

### Test 1.1: Email/Password Signup

**Objective**: Verify new user can create an account using email and password

**Steps**:
1. Navigate to https://rag-prompt-library.web.app
2. Click "Sign Up" or "Get Started" button
3. Locate the signup form
4. Fill in the following details:
   - **Email**: `test-prod-${timestamp}@example.com` (use current timestamp)
   - **Password**: `TestPassword123!`
   - **Confirm Password**: `TestPassword123!` (if field exists)
5. Click "Sign Up" or "Create Account" button
6. Wait for response

**Expected Results**:
- ✅ Signup form displays without errors
- ✅ Email field validates format (shows error for invalid email)
- ✅ Password field shows strength indicator
- ✅ Password must meet requirements (min 8 chars, uppercase, lowercase, number, special char)
- ✅ Form submits successfully
- ✅ User is redirected to dashboard or onboarding flow
- ✅ Success message or welcome screen appears
- ✅ User session is established (check DevTools > Application > Cookies)

**Verification in Firebase Console**:
1. Open Firebase Console > Authentication > Users
2. Verify new user appears in the list
3. Check user UID and email match
4. Open Firestore > users collection
5. Verify user document created with correct data

**Pass/Fail Criteria**:
- **PASS**: User account created, redirected to dashboard, session established
- **FAIL**: Any error during signup, no redirect, or user not created in Firebase

**Notes**: _______________________________________________

---

### Test 1.2: Email/Password Login

**Objective**: Verify existing user can login with email and password

**Steps**:
1. If logged in, click "Logout" first
2. Navigate to https://rag-prompt-library.web.app/login
3. Locate the login form
4. Enter credentials from Test 1.1:
   - **Email**: (use email from signup test)
   - **Password**: `TestPassword123!`
5. Click "Login" or "Sign In" button
6. Wait for response

**Expected Results**:
- ✅ Login form displays without errors
- ✅ Credentials are validated
- ✅ Successful login redirects to dashboard
- ✅ User profile data loads (name, email, avatar)
- ✅ Navigation menu shows user-specific options
- ✅ Session persists (check cookies)

**Error Testing**:
1. Try login with wrong password
   - Expected: Error message "Invalid credentials" or similar
2. Try login with non-existent email
   - Expected: Error message "User not found" or similar
3. Try login with empty fields
   - Expected: Validation errors on required fields

**Pass/Fail Criteria**:
- **PASS**: Successful login with correct credentials, appropriate errors for invalid attempts
- **FAIL**: Cannot login with valid credentials, or no error handling for invalid attempts

**Notes**: _______________________________________________

---

### Test 1.3: Google OAuth Login

**Objective**: Verify user can login using Google OAuth

**Steps**:
1. If logged in, click "Logout" first
2. Navigate to https://rag-prompt-library.web.app/login
3. Click "Sign in with Google" button
4. Google OAuth popup should appear
5. Select a Google account or enter credentials
6. Authorize the application
7. Wait for redirect back to application

**Expected Results**:
- ✅ Google OAuth popup opens correctly
- ✅ OAuth consent screen shows correct app name and permissions
- ✅ After authorization, popup closes
- ✅ User is redirected to dashboard
- ✅ User profile populated with Google account data (name, email, photo)
- ✅ Session established

**Verification in Firebase Console**:
1. Check Authentication > Users
2. Verify user has "google.com" as provider
3. Check user profile data populated from Google

**Pass/Fail Criteria**:
- **PASS**: OAuth flow completes successfully, user authenticated and redirected
- **FAIL**: OAuth popup doesn't open, authorization fails, or no redirect

**Notes**: _______________________________________________

---

### Test 1.4: Session Persistence

**Objective**: Verify user session persists across page refreshes and browser restarts

**Steps**:
1. Login successfully (using any method from above)
2. Verify you're on the dashboard
3. **Test A: Page Refresh**
   - Press F5 or click browser refresh
   - Wait for page to reload
   - Verify you're still logged in
4. **Test B: Tab Close/Reopen**
   - Note the current URL
   - Close the browser tab
   - Open a new tab
   - Navigate to the same URL
   - Verify you're still logged in
5. **Test C: Browser Restart** (Optional)
   - Close entire browser
   - Reopen browser
   - Navigate to https://rag-prompt-library.web.app
   - Verify you're still logged in

**Expected Results**:
- ✅ Session persists after page refresh
- ✅ Session persists after tab close/reopen
- ✅ Session persists after browser restart (if "Remember Me" was checked)
- ✅ User data loads correctly after each test
- ✅ No re-authentication required

**Pass/Fail Criteria**:
- **PASS**: Session persists in all scenarios
- **FAIL**: User logged out after any of the tests

**Notes**: _______________________________________________

---

### Test 1.5: Logout

**Objective**: Verify user can logout and session is properly cleared

**Steps**:
1. Ensure you're logged in
2. Locate the logout button (usually in user menu or settings)
3. Click "Logout" or "Sign Out"
4. Wait for response

**Expected Results**:
- ✅ Logout action completes successfully
- ✅ User redirected to login page or home page
- ✅ Session cleared (check DevTools > Application > Cookies)
- ✅ User data no longer accessible
- ✅ Attempting to access protected routes redirects to login

**Verification**:
1. After logout, try to navigate to `/dashboard`
2. Expected: Redirect to login page
3. Check browser cookies - Firebase auth tokens should be cleared

**Pass/Fail Criteria**:
- **PASS**: Logout successful, session cleared, protected routes inaccessible
- **FAIL**: Still logged in after logout, or can access protected routes

**Notes**: _______________________________________________

---

## 2️⃣ Prompt Management Operations

### Test 2.1: Create Prompt

**Objective**: Verify user can create a new prompt

**Steps**:
1. Login to the application
2. Navigate to `/dashboard/prompts`
3. Click "Create Prompt", "New Prompt", or "+" button
4. Fill in prompt details:
   - **Title**: "Test Prompt - Production Verification"
   - **Description**: "This is a test prompt created during production verification"
   - **Content/Template**: "You are a helpful assistant. Please help with: {{user_input}}"
   - **Category**: Select any category (e.g., "General")
   - **Tags**: "test, verification, production"
   - **Visibility**: "Private" or "Public" (test both if possible)
5. Click "Save" or "Create" button
6. Wait for response

**Expected Results**:
- ✅ Create prompt modal/form opens smoothly
- ✅ All fields are editable
- ✅ Form validation works (required fields, character limits)
- ✅ Template variables ({{user_input}}) are recognized
- ✅ Save operation completes successfully
- ✅ Success notification appears
- ✅ Prompt appears in the prompts list immediately
- ✅ Prompt details are accurate

**Verification in Firebase Console**:
1. Open Firestore > prompts collection
2. Find the newly created prompt document
3. Verify all fields are saved correctly
4. Check timestamps (createdAt, updatedAt)
5. Verify user ownership (userId field)

**Performance Check**:
- Save operation should complete in < 2 seconds
- Check Network tab for API call response time

**Pass/Fail Criteria**:
- **PASS**: Prompt created successfully, appears in list, saved to Firestore
- **FAIL**: Save fails, prompt doesn't appear, or data not saved correctly

**Notes**: _______________________________________________

---

### Test 2.2: Read/View Prompt

**Objective**: Verify user can view prompt details

**Steps**:
1. From the prompts list, click on the prompt created in Test 2.1
2. Prompt details should display (in modal, sidebar, or new page)
3. Review all displayed information

**Expected Results**:
- ✅ Prompt details load quickly (< 500ms)
- ✅ All fields display correctly:
  - Title
  - Description
  - Content/Template
  - Category
  - Tags
  - Visibility
  - Created date
  - Last modified date
- ✅ Template variables are highlighted or formatted
- ✅ No loading errors

**Pass/Fail Criteria**:
- **PASS**: Prompt details load correctly and completely
- **FAIL**: Details don't load, missing fields, or errors

**Notes**: _______________________________________________

---

### Test 2.3: Update Prompt

**Objective**: Verify user can edit and update an existing prompt

**Steps**:
1. Open the prompt created in Test 2.1
2. Click "Edit" button
3. Modify the following:
   - **Title**: "Test Prompt - Production Verification (UPDATED)"
   - **Description**: Add " - This prompt has been updated"
   - **Content**: Modify template slightly
4. Click "Save" or "Update" button
5. Wait for response

**Expected Results**:
- ✅ Edit mode activates successfully
- ✅ All fields are editable
- ✅ Changes are saved successfully
- ✅ Success notification appears
- ✅ Updates reflected immediately in the UI
- ✅ Updated timestamp changes

**Verification in Firebase Console**:
1. Open Firestore > prompts collection
2. Find the prompt document
3. Verify changes are saved
4. Check updatedAt timestamp is recent

**Pass/Fail Criteria**:
- **PASS**: Prompt updated successfully, changes persist
- **FAIL**: Update fails, changes don't save, or errors occur

**Notes**: _______________________________________________

---

### Test 2.4: Delete Prompt

**Objective**: Verify user can delete a prompt

**Steps**:
1. Locate the prompt created in Test 2.1
2. Click "Delete" button or icon
3. Confirmation modal should appear
4. Read the confirmation message
5. Click "Confirm" or "Delete" to proceed
6. Wait for response

**Expected Results**:
- ✅ Delete confirmation modal appears
- ✅ Confirmation message is clear
- ✅ Delete operation completes successfully
- ✅ Success notification appears
- ✅ Prompt removed from list immediately
- ✅ Prompt document deleted from Firestore

**Verification in Firebase Console**:
1. Open Firestore > prompts collection
2. Verify prompt document is deleted (or marked as deleted)
3. Check if soft delete is used (deleted: true flag)

**Pass/Fail Criteria**:
- **PASS**: Prompt deleted successfully, removed from UI and Firestore
- **FAIL**: Delete fails, prompt still visible, or errors occur

**Notes**: _______________________________________________

---

## 3️⃣ Navigation and Routing

### Test 3.1: Route Accessibility

**Objective**: Verify all application routes are accessible

**Routes to Test**:
1. `/` - Home/Landing page
2. `/login` - Login page
3. `/signup` - Signup page
4. `/dashboard` - Main dashboard
5. `/dashboard/prompts` - Prompts list
6. `/dashboard/documents` - Documents page
7. `/dashboard/executions` - Executions history
8. `/dashboard/marketplace` - Template marketplace
9. `/dashboard/analytics` - Analytics dashboard
10. `/dashboard/workspaces` - Team workspaces
11. `/dashboard/help` - Help center
12. `/dashboard/settings` - User settings

**For Each Route**:
1. Navigate to the URL directly (type in address bar)
2. Verify page loads without 404 error
3. Check page content displays correctly
4. Verify no console errors
5. Check response time (should be < 500ms)

**Expected Results**:
- ✅ All routes load successfully
- ✅ No 404 or 500 errors
- ✅ Page content appropriate for each route
- ✅ Protected routes redirect to login when not authenticated
- ✅ Fast load times

**Pass/Fail Criteria**:
- **PASS**: All routes accessible, appropriate content, proper authentication checks
- **FAIL**: Any route returns 404, or protected routes accessible without auth

**Notes**: _______________________________________________

---

## 📊 Test Results Summary

### Authentication Tests
- [ ] Email/Password Signup: ___________
- [ ] Email/Password Login: ___________
- [ ] Google OAuth Login: ___________
- [ ] Session Persistence: ___________
- [ ] Logout: ___________

### Prompt Management Tests
- [ ] Create Prompt: ___________
- [ ] Read/View Prompt: ___________
- [ ] Update Prompt: ___________
- [ ] Delete Prompt: ___________

### Navigation Tests
- [ ] Route Accessibility: ___________

### Overall Assessment
- **Total Tests**: 10
- **Passed**: ___
- **Failed**: ___
- **Pass Rate**: ___%

---

## 🐛 Issues Found

### Critical Issues
_Document any critical issues that prevent core functionality_

### High Priority Issues
_Document any high priority issues that significantly impact user experience_

### Medium Priority Issues
_Document any medium priority issues_

### Low Priority Issues
_Document any low priority issues or minor bugs_

---

## 📝 Additional Notes

_Add any additional observations, recommendations, or concerns_

---

**Testing Completed By**: _______________  
**Date**: _______________  
**Browser Used**: _______________  
**Next Steps**: _______________

