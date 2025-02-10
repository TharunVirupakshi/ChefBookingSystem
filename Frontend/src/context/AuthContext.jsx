// AuthContext.js
import React, { createContext, useState, useContext, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../Firebase/firebase";
import { useNavigate } from "react-router-dom";
import { useNotification } from "./NotificationsContext";




const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
 
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { removePermission } = useNotification();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Firebase User object
      setLoading(false);
      if (!currentUser) {
        // navigate("/login"); // Redirect if no user
        console.log('[AuthContext] User is null')
      }
      currentUser?.getIdTokenResult().then(token => console.log('token: ',token))
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [navigate]);

 

  const getUserType = async () => {
      const token = await auth.currentUser.getIdTokenResult();
      if(token.claims.chef) return 'CHEF';
      if(token.claims.admin) return 'ADMIN';

      return 'USER';
  };

  const logout = async () => {
    if (user) {
      removePermission(user.uid);// Call removePermission to remove the token and permission
    }
    await auth.signOut();
    setUser(null);
    navigate("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, getUserType, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
