// frontend/context/PatientContext.tsx

import React, { createContext, useState, useContext, ReactNode } from 'react';
import { UserProfile } from '../services/apiService'; // Reutilizamos la interfaz del apiService

interface PatientContextType {
  selectedPatient: UserProfile | null;
  selectPatient: (patient: UserProfile) => void;
  clearSelectedPatient: () => void;
}

const PatientContext = createContext<PatientContextType | undefined>(undefined);

export const PatientProvider = ({ children }: { children: ReactNode }) => {
  const [selectedPatient, setSelectedPatient] = useState<UserProfile | null>(null);

  const selectPatient = (patient: UserProfile) => {
    setSelectedPatient(patient);
  };

  const clearSelectedPatient = () => {
    setSelectedPatient(null);
  };

  return (
    <PatientContext.Provider value={{ selectedPatient, selectPatient, clearSelectedPatient }}>
      {children}
    </PatientContext.Provider>
  );
};

export const usePatient = (): PatientContextType => {
  const context = useContext(PatientContext);
  if (context === undefined) {
    throw new Error('usePatient debe ser usado dentro de un PatientProvider');
  }
  return context;
};