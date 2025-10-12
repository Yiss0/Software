// frontend/context/AuthContext.tsx

import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { UserProfile } from '../services/apiService'; // Importamos la interfaz de usuario

// ¡IMPORTANTE! Hemos cambiado 'session' de string a UserProfile | null
interface AuthContextData {
  user: UserProfile | null; // Cambiamos 'session' por 'user' para más claridad
  isLoading: boolean;
  setUser: (user: UserProfile | null) => void; // Cambiamos 'setSession' por 'setUser'
}

const AuthContext = createContext<AuthContextData>({
  user: null,
  isLoading: true,
  setUser: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

// El almacenamiento seguro no cambia
const storage = {
  getItem: (key: string) => SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) => SecureStore.deleteItemAsync(key),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadUserFromStorage() {
      try {
        const storedUser = await storage.getItem('user_session');
        if (storedUser) {
          setUserState(JSON.parse(storedUser)); // El usuario se guarda como un objeto JSON
        }
      } catch (e) {
        console.error("Failed to load user from storage", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadUserFromStorage();
  }, []);

  const handleSetUser = async (user: UserProfile | null) => {
    setUserState(user);
    if (user) {
      // Guardamos el objeto de usuario completo como un string JSON
      await storage.setItem('user_session', JSON.stringify(user));
    } else {
      await storage.deleteItem('user_session');
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, setUser: handleSetUser }}>
      {children}
    </AuthContext.Provider>
  );
}