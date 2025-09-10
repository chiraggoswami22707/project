# Supervisor Dashboard Tab Implementation Plan

## Overview
Transform the supervisor dashboard to have category-specific tabs with table view, filters, and export functionality.

## Implementation Steps

### 1. Tab Structure
- [ ] Create tabs for each category: Electrical, Plumbing, Maintenance, Cleaning, Lab/Server
- [ ] Each tab should show only complaints assigned to the supervisor for that specific category

### 2. Table View
- [ ] Create a scrollable table component with columns:
  - Complaint ID
  - Date Submitted
  - Building Name
  - Room Number
  - Complaint Type (category)
  - Reporter Name (student/staff)
  - Final Status (adminFinalStatus or status)

### 3. Filters
- [ ] Date Range: From Date - To Date (calendar pickers)
- [ ] Status Filter: Dropdown with Pending, In Progress, Resolved, Reopened
- [ ] Location Filter: Building and Room input fields
- [ ] Clear Filters button to reset all filters

### 4. Summary Cards
- [ ] Total Complaints for the category
- [ ] Resolved Complaints (using adminFinalStatus)
- [ ] Pending Complaints (using adminFinalStatus)

### 5. Export Functionality
- [ ] Export to Excel button that respects active filters
- [ ] Export should include all table columns plus additional complaint details

### 6. Empty State
- [ ] Show "No complaints available for this supervisor or filter selection" when no complaints match

### 7. UI/UX
- [ ] Consistent design across all tabs
- [ ] Responsive layout for filters and table
- [ ] Scrollable table container
- [ ] Clean, rounded statistic cards

## Technical Requirements
- Use existing UI components (Card, Button, Input, Calendar)
- Implement proper filtering logic
- Ensure export functionality works with filtered data
- Maintain supervisor-specific complaint filtering
- Use adminFinalStatus for status display when available

## Files to Modify
- `src/app/supervisor-dashboard/page.js` (main implementation)
- May need to add utility functions for export and filtering

## Dependencies
- xlsx library (already available from maintenance dashboard)
- date-fns for date formatting
- Existing UI components
