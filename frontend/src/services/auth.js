import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { auth } from "./firebase";

/* ---------------- SIGNUP ---------------- */

export const signupUser = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // store user locally
  localStorage.setItem(
    "cloudburst_user",
    JSON.stringify({
      email: user.email,
      uid: user.uid
    })
  );

  return user;
};

/* ---------------- LOGIN ---------------- */

export const loginUser = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );

  const user = userCredential.user;

  // store user info
  localStorage.setItem(
    "cloudburst_user",
    JSON.stringify({
      email: user.email,
      uid: user.uid
    })
  );

  // 🔹 create pseudo token for backend (temporary fix)
  const token = await user.getIdToken();

  localStorage.setItem("cloudburst_token", token);

  return user;
};

/* ---------------- LOGOUT ---------------- */

export const logoutUser = async () => {
  await signOut(auth);

  localStorage.removeItem("cloudburst_user");
  localStorage.removeItem("cloudburst_token");
};