import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SQLiteDatabase } from 'expo-sqlite';
import * as db from '../services/database';

interface AuthContextData {
  session: string | null;
  userType: 'usuario' | 'cuidador' | null;
  isLoading: boolean;
  database: SQLiteDatabase | null;
  setSession: (session: string | null, type?: 'usuario' | 'cuidador') => void;
}

const AuthContext = createContext<AuthContextData>({
  session: null,
  userType: null,
  isLoading: true,
  database: null,
  setSession: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const storage = {
  getItem: (key: string) => Platform.OS === 'web' ? AsyncStorage.getItem(key) : SecureStore.getItemAsync(key),
  setItem: (key: string, value: string) => Platform.OS === 'web' ? AsyncStorage.setItem(key, value) : SecureStore.setItemAsync(key, value),
  deleteItem: (key: string) => Platform.OS === 'web' ? AsyncStorage.removeItem(key) : SecureStore.deleteItemAsync(key),
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<string | null>(null);
  const [userType, setUserType] = useState<'usuario' | 'cuidador' | null>(null);
  const [database, setDatabase] = useState<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const dbConnection = await db.initializeDatabase();
        setDatabase(dbConnection);

        // Cargar sesión y tipo de usuario almacenados
        const storedSession = await storage.getItem('session_token');
        const storedUserType = await storage.getItem('user_type') as 'usuario' | 'cuidador' | null;
        
        if (storedSession) {
          setSession(storedSession);
          setUserType(storedUserType || 'usuario');
        }

      } catch (e) {
        console.error("Failed to load data or database", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSetSession = async (token: string | null, type: 'usuario' | 'cuidador' = 'usuario') => {
    setSession(token);
    setUserType(type);
    if (token) {
      await storage.setItem('session_token', token);
      await storage.setItem('user_type', type);
    } else {
      await storage.deleteItem('session_token');
      await storage.deleteItem('user_type');
    }
  };

  return (
    <AuthContext.Provider value={{ session, userType, isLoading, database, setSession: handleSetSession }}>
      {children}
    </AuthContext.Provider>
  );
}