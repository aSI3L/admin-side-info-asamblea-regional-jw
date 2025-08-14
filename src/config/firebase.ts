import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getAuth, GoogleAuthProvider } from "firebase/auth"
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCxCVx1lt3LKAXNb30sA1G-I00PLzaXjTA",
  authDomain: "asamblea-4440d.firebaseapp.com",
  projectId: "asamblea-4440d",
  storageBucket: "asamblea-4440d.firebasestorage.app",
  messagingSenderId: "949414428847",
  appId: "1:949414428847:web:30b9c77889a7a221bd145a"
};
// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();