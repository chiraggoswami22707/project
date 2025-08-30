# Maintenance Dashboard Fix Plan

## Issues Identified:
1. ProfileCard component imported but not properly integrated
2. Missing user data fetching from localStorage/Firestore
3. Conflicting profile dropdown functionality in header
4. Layout issues with fixed positioning

## Steps to Fix:

### 1. Remove Conflicting Profile Dropdown
- Remove the duplicate profile dropdown from the header
- Keep only the ProfileCard component for profile display

### 2. Add User Data Fetching
- Add useEffect to fetch user data from localStorage like student dashboard
- Set up userData state management

### 3. Proper ProfileCard Integration
- Add ProfileCard component with fixed left positioning
- Pass userData to ProfileCard component
- Adjust main content margin to avoid overlap

### 4. Layout Adjustments
- Remove the profile dropdown section from header
- Adjust main content container margin to account for fixed ProfileCard

### 5. Testing
- Verify ProfileCard displays user information correctly
- Ensure all complaint management features work properly
- Test layout responsiveness

## Files to Modify:
- `src/app/maintenance-dashboard/page.js` - Main fixes

## Expected Result:
- Maintenance dashboard should function like before profile implementation
- ProfileCard should display user information properly
- No duplicate profile functionality
- Clean, functional interface
