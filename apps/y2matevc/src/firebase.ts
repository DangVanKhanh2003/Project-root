// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyB2Zy3TnWkcNcyBjVEkzwvdEuHl60qZV2M",
  authDomain: "y2matevc.firebaseapp.com",
  projectId: "y2matevc",
  storageBucket: "y2matevc.firebasestorage.app",
  messagingSenderId: "637335647755",
  appId: "1:637335647755:web:45a078eb3d256c3d4c390e",
  measurementId: "G-SD2KJ56YSD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);