import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, useGetMe } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (token: string, userData?: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const TOKEN_KEY = 'skillforge_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [cachedUser, setCachedUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  const { data: fetchedUser, isLoading, error } = useGetMe({
    query: {
      queryKey: ['me'],
      enabled: !!token,
      retry: false,
    }
  });

  useEffect(() => {
    if (error) {
      // If token is invalid, clear it
      localStorage.removeItem(TOKEN_KEY);
      setToken(null);
      setCachedUser(null);
    }
  }, [error]);

  // Sync fetched user into cache
  useEffect(() => {
    if (fetchedUser) {
      setCachedUser(fetchedUser);
    }
  }, [fetchedUser]);

  const user = fetchedUser || cachedUser;

  const login = (newToken: string, userData?: User) => {
    localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    if (userData) {
      setCachedUser(userData);
    }
  };

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCachedUser(null);
    queryClient.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || null,
        isLoading: !!token && isLoading && !cachedUser,
        isAuthenticated: !!token && (!!user || !!cachedUser),
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
