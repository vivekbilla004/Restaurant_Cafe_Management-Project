import React, { createContext, useState, useEffect, useContext } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('omicra_token'));
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
    const savedToken = localStorage.getItem('omicra_token');
    if (savedToken) {
      setAuthData(savedToken);
    }
    setLoading(false);
  }, []);

  const login = (newToken) => {
    localStorage.setItem('omicra_token', newToken);
    setToken(newToken);
    const decoded = setAuthData(newToken);
    return decoded; // Return decoded data so Login component can use it immediately
  };

  const logout = () => {
    localStorage.removeItem('omicra_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);