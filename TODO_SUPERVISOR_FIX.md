# Supervisor Dashboard Fix Steps

## 1. Update Categories ✅
- Add descriptions to categories in page.js.

## 2. Import Components ✅
- Import ProfileCard and CategoryCard.

## 3. Update Layout ✅
- Change to flex row: left ProfileCard, right CategoryCard grid.

## 4. Calculate Stats for Categories ✅
- For each category, compute total, pending, inProgress, resolved, reopened counts.

## 5. Integrate CategoryCard ✅
- Use CategoryCard instead of custom divs.
- Pass stats and onClick to select category.

## 6. Handle Complaint Display ✅
- On category select, show list below the grid.

## 7. Add Export Functionality ✅
- Add button to export complaints to CSV.

## 8. Test and Verify
- Ensure responsive layout.
- Verify real-time updates.
