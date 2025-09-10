# Profile Section Implementation Plan

## 📋 Task Overview
Add a Profile Section (card style) to the left side of all dashboards (Student, Staff, Supervisor, Maintenance) with user data from Firestore.

## 🎯 Requirements
- Profile card should show:
  → User's Name
  → User's Role (Student / Staff / Supervisor / Maintenance)
  → If Role = Supervisor → also show Category (Cleaning, Electrical, Plumbing, Maintenance, Lab/Server)
- Data should come from Firestore "users" collection
- During signup, ask user to enter their Name
- Role is determined by email domain (@gmail, @staff, @sup, or admin key)
- Store Name and Role in Firestore at signup
- On login, fetch Name and Role and display them in Profile card
- Style: card UI similar to ERP student portal (rounded, shadow, clean background)
- Position: fixed/left side of the dashboard, visible at all times

## 🔧 Implementation Steps

### 1. Update Signup Page (`src/app/signup/page.js`)
- Add input field for user's name
- Update Firestore storage to include name field
- Store: { email, role, name }

### 2. Update Login Page (`src/app/login/page.js`)
- Fetch user data from Firestore "users" collection on login
- Store user data in localStorage/session for dashboard access

### 3. Create Profile Card Component (`src/components/ProfileCard.js`)
- Reusable component for all dashboards
- Props: user data (name, role, email, category for supervisors)
- Styled as card with rounded corners, shadow, clean background
- Fixed left position

### 4. Update All Dashboards
Add ProfileCard component to:
- Student Dashboard (`src/app/student-dashboard/page.js`)
- Staff Dashboard (`src/app/staff-dashboard/page.js`) 
- Supervisor Dashboard (`src/app/supervisor-dashboard/page.js`)
- Maintenance Dashboard (`src/app/maintenance-dashboard/page.js`)

### 5. Supervisor Category Handling
- For supervisors, store category in Firestore during signup
- Display category in profile card for supervisors

## 📁 Files to Modify/Create

### New Files:
1. `src/components/ProfileCard.js` - Profile card component

### Files to Modify:
1. `src/app/signup/page.js` - Add name input and Firestore update
2. `src/app/login/page.js` - Fetch user data from Firestore
3. `src/app/student-dashboard/page.js` - Add ProfileCard component
4. `src/app/staff-dashboard/page.js` - Add ProfileCard component  
5. `src/app/supervisor-dashboard/page.js` - Add ProfileCard component
6. `src/app/maintenance-dashboard/page.js` - Add ProfileCard component

## 🎨 Design Specifications
- Card style: rounded corners (rounded-xl), shadow (shadow-lg), clean white/blue background
- Position: fixed left side, top-aligned
- Content: User avatar/icon, Name, Role, Email, Category (for supervisors)
- Responsive design for mobile/desktop

## 🔄 Data Flow
1. Signup → User enters name, email, role → Store in Firestore `users/{uid}`
2. Login → Fetch user data from Firestore → Store in local state
3. Dashboard → Pass user data to ProfileCard component → Display

## 🚀 Success Criteria
- All dashboards show profile card on left side
- Profile card displays correct user information
- Signup process includes name collection
- Login fetches user data from Firestore
- Supervisor category is properly handled and displayed
