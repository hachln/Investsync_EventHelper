// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBwLa2xtnIuVJPLu6D5MqYWqk7jEpyEX14",
  authDomain: "investsync-eventhelper.firebaseapp.com",
  projectId: "investsync-eventhelper",
  storageBucket: "investsync-eventhelper.firebasestorage.app",
  messagingSenderId: "354971067322",
  appId: "1:354971067322:web:d31d01648368a4aabef383",
  measurementId: "G-9K42C1M2ZX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { db, auth, googleProvider };