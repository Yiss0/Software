import React, { createContext, useState, useContext, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { SQLiteDatabase } from 'expo-sqlite';
import * as db from '../services/database';

interface AuthContextData {
  session: string | null;
  isLoading: boolean;
  database: SQLiteDatabase | null;
  setSession: (session: string | null) => void;
}

const AuthContext = createContext<AuthContextData>({
  session: null,
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
  const [database, setDatabase] = useState<SQLiteDatabase | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const dbConnection = await db.initializeDatabase();
        setDatabase(dbConnection);

        // --- CAMBIO TEMPORAL PARA PRUEBAS ---
        // Ignoramos el token guardado en el celular y forzamos el uso
        // del ID de usuario real que obtuvimos del backend.
        // Esto simula un inicio de sesión exitoso contra el servidor.
        const backendUserId = 'cmg63icdz0000tescziesac32';
        setSession(backendUserId);
        console.log(`Sesión forzada para pruebas con el ID del backend: ${backendUserId}`);
        // --- FIN DEL CAMBIO TEMPORAL ---

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