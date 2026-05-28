import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "../services/firebase";

const AuthContext = createContext();

export function AuthProvider({ children }) {

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {

      if (firebaseUser) {

        setUser({
          email: firebaseUser.email,
          uid: firebaseUser.uid
        });

      } else {

        setUser(null);

      }

      setLoading(false);

    });

    return () => unsubscribe();

  }, []);

  const logout = async () => {

    await signOut(auth);

  };

  return (

    <AuthContext.Provider value={{ user, logout }}>

      {loading ? (

        <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white text-lg">
          Loading Cloudburst AI...
        </div>

      ) : (

        children

      )}

    </AuthContext.Provider>

  );

}

export const useAuth = () => useContext(AuthContext);