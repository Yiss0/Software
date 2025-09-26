import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SQLiteDatabase } from 'expo-sqlite';
import * as db from '../services/database';

interface AuthContextData {
  session: string | null;
  isLoading: boolean;
  database: SQLiteDatabase | null; // <-- NUEVO: compartimos la BD
  setSession: (session: string | null) => void;
}

const AuthContext = createContext<AuthContextData>({
  session: null,
  isLoading: true,
  database: null, // <-- NUEVO
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
  const [database, setDatabase] = useState<SQLiteDatabase | null>(null); // <-- NUEVO
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        // Inicializamos la base de datos y la guardamos en el estado
        const dbConnection = await db.initializeDatabase();
        setDatabase(dbConnection);

        // Cargamos el token de sesión
        const token = await storage.getItem('session_token');
        if (token) {
          setSession(token);
        }
      } catch (e) {
        console.error("Failed to load data or database", e);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSetSession = async (token: string | null) => {
    setSession(token);
    if (token) {
      await storage.setItem('session_token', token);
    } else {
      await storage.deleteItem('session_token');
    }
  };

  return (
    <AuthContext.Provider value={{ session, isLoading, database, setSession: handleSetSession }}>
      {children}
    </AuthContext.Provider>
  );
}