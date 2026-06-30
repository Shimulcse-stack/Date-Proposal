import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA1XZjbzrvAYeJyknL_3832xiiriOTc2tk",
  authDomain: "articulate-script-b7krv.firebaseapp.com",
  projectId: "articulate-script-b7krv",
  storageBucket: "articulate-script-b7krv.firebasestorage.app",
  messagingSenderId: "941392839657",
  appId: "1:941392839657:web:e9d56c7b14c71fe8970178"
};

const app = initializeApp(firebaseConfig);

// Initialize Firestore targeting our custom database ID
export const db = getFirestore(app, "ai-studio-romanticdateprop-dee7d685-cc8a-4a57-8bd5-978131fc0272");
