// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBjek2Bl9lftX5Bl9h7Zw3sa1rd-w5JKnk",
  authDomain: "learn-firebase-10e3c.firebaseapp.com",
  projectId: "learn-firebase-10e3c",
  storageBucket: "learn-firebase-10e3c.firebasestorage.app",
  messagingSenderId: "595255352129",
  appId: "1:595255352129:web:cc46b297fa35efdf16dfc0",
  measurementId: "G-24K3BR5TK7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);