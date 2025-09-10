# TODO: Add Photo Upload Button in Student Dashboard

## Steps to Complete:
- [ ] Import Firebase Storage functions (ref, uploadBytes, getDownloadURL) in student-dashboard/page.js
- [ ] Add React state for selected photo file
- [ ] Add file input button in complaint submission form
- [ ] Update handleSubmit function to upload photo to Firebase Storage and get download URL
- [ ] Include photo URL in complaint data saved to Firestore
- [ ] Update complaint details modal to display uploaded photo if available
- [ ] Test photo upload and display functionality

## Notes:
- Firebase Storage is already configured in firebase/config.js
- Photo will be stored under "complaintPhotos/{userEmail}/{timestamp}_{filename}"
- Photo URL will be saved in complaint data as "photoUrl"
