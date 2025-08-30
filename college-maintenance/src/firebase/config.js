  // src/firebase/config.js
  import { initializeApp } from "firebase/app";
  import { getAuth } from "firebase/auth";
  import { getFirestore } from "firebase/firestore";
  import { getStorage } from "firebase/storage";

  const firebaseConfig = {
    apiKey: "AIzaSyBXTMgkX-VBfn_KqULHyy0hCXHti254nyY",
    authDomain: "college-maintenance-dba8f.firebaseapp.com",
    projectId: "college-maintenance-dba8f",
    storageBucket: "college-maintenance-dba8f.appspot.com",
    messagingSenderId: "84923083315",
    appId: "1:84923083315:web:8acc090790f72acd9ed146"
  };

  const app = initializeApp(firebaseConfig);

  export const auth = getAuth(app);
  export const db = getFirestore(app);
  export const storage = getStorage(app);
