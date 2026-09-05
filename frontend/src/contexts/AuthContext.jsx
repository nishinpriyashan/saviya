import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../firebase/config";

const AuthContext = createContext();

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true); // Always start loading

  useEffect(() => {
    if (!auth || !db) {
      console.error("Firebase is not initialized. Check your .env file.");
      setLoading(false);
      return undefined;
    }

    let unsubscribeSnapshot = null;

    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      
      if (user) {
        // Listen to the Firestore user document in real-time
        unsubscribeSnapshot = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUserData({ id: user.uid, ...docSnap.data() });
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching user data:", error);
          setUserData(null);
          setLoading(false);
        });
      } else {
        setUserData(null);
        if (unsubscribeSnapshot) {
          unsubscribeSnapshot();
          unsubscribeSnapshot = null;
        }
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    loading,
    isBeneficiary: userData?.role === "beneficiary",
    isDonor: userData?.role === "donor",
    isGN: userData?.role === "gn",
    isAdmin: userData?.role === "admin",
  };

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground text-sm">Loading Saviya...</p>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}
