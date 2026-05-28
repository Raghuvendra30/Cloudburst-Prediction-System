import { initializeApp } from "firebase/app";
import { 
  getAuth,
  onAuthStateChanged,
  signOut
} from "firebase/auth";

import {
  getDatabase,
  ref,
  onValue,
  off
} from "firebase/database";

/* --------------------------------
   Firebase Configuration
-------------------------------- */

const firebaseConfig = {
  apiKey: "AIzaSyDJ1NCuwB0VNJwaQCNNmMzRxglw4PQFLNA",
  authDomain: "iot-project-84cda.firebaseapp.com",
  databaseURL: "https://iot-project-84cda-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "iot-project-84cda",
  storageBucket: "iot-project-84cda.firebasestorage.app",
  messagingSenderId: "735193254472",
  appId: "1:735193254472:web:ebf4674d684e983127a67d",
  measurementId: "G-63S15B06ZJ"
};

/* --------------------------------
   Initialize Firebase
-------------------------------- */

const app = initializeApp(firebaseConfig);

/* --------------------------------
   Services
-------------------------------- */

export const auth = getAuth(app);
export const database = getDatabase(app);

/* --------------------------------
   AUTH HELPERS
-------------------------------- */

// listen for login/logout state
export const listenToAuth = (callback) => {
  return onAuthStateChanged(auth, callback);
};

// logout user
export const logoutUser = async () => {
  await signOut(auth);
};

/* --------------------------------
   SENSOR DATA SUBSCRIPTION
-------------------------------- */

export const subscribeToSensors = (callback) => {

  const sensorRef = ref(database, "sensorData/latest");

  const unsubscribe = onValue(sensorRef, (snapshot) => {
    if (snapshot.exists()) {
      callback(snapshot.val());
    }
  });

  return () => off(sensorRef, "value", unsubscribe);
};