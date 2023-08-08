import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFunctions } from "firebase/functions";
import { getDatabase, ref, onValue } from "firebase/database";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { getStorage } from "firebase/storage";


const firebaseConfig = {
  apiKey: "AIzaSyDZsVB8PPb57GmgPV_eQu2fyf6wQgr1YwE",
  authDomain: "actual-project-517e2.firebaseapp.com",
  projectId: "actual-project-517e2",
  storageBucket: "actual-project-517e2.appspot.com",
  messagingSenderId: "675233324870",
  appId: "1:675233324870:web:bb4449e6071c3ae2978f47",
  measurementId: "G-9Q4L042QMX",
  databaseURL: "https://actual-project-517e2-default-rtdb.firebaseio.com/",
};

  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  // Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const functions = getFunctions(app);
export const database = getDatabase(app);
export const auth = getAuth();
export const storage = getStorage(app)
