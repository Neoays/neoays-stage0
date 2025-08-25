// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAQMkBJlQYnY8oQkdnqENfnkA9SU2k8Hjw",
  authDomain: "neoays-stage0.firebaseapp.com",
  projectId: "neoays-stage0",
  storageBucket: "neoays-stage0.firebasestorage.app",
  messagingSenderId: "335928092721",
  appId: "1:335928092721:web:f9a77840047dcdf0d4cd10",
  measurementId: "G-NR6ZF1G6QE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);