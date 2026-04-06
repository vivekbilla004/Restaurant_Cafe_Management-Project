import React, { createContext, useState, useEffect, useContext } from "react";
import { jwtDecode } from "jwt-decode";


const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("omicra_token"));
  const [loading, setLoading] = useState(true);

  // Helper to decode and set user
  const setAuthData = (token) => {
    try {
      const decoded = jwtDecode(token);
      // Check expiry [cite: 205, 251]
      if (decoded.exp * 1000 < Date.now()) {
        logout();
        return null;
      }
      setUser(decoded);
      return decoded;
    } catch (e) {
      logout();
      return null;
    }
  };

  useEffect(() => {
    const savedToken = localStorage.getItem("omicra_token");
    if (savedToken) {
      setAuthData(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem("omicra_token", newToken);
    setToken(newToken);
    const decoded = setAuthData(newToken);
    return decoded; // Return decoded data so Login component can use it immediately
  };

  const logout = () => {
    localStorage.removeItem("omicra_token");
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    const handleStorageChange = (e) => {
      // If another tab modifies the token (logs in as someone else or logs out)
      if (e.key === "token" || e.key === "user") {
        console.warn("Auth state changed in another tab. Syncing...");
        // Option 1: Force a hard reload so the tab updates to the new role
        window.location.reload();

        // Option 2: Log them out completely for security
        // logout();
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, token, login, logout, isAuthenticated: !!token, loading }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
