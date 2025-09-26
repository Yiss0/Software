import * as SQLite from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { SQLiteDatabase } from 'expo-sqlite';

// --- TIPOS DE DATOS ---
export type User = { id: number; nombre: string; apellido: string; email: string; telefono: string; fechaNacimiento?: string | null; direccion?: string | null; contactoEmergencia?: string | null; telefonoEmergencia?: string | null; condicionesMedicas?: string | null; alergias?: string | null; };
export type Medication = { id: number; userId: number; name: string; dosage: string; quantity: number; instructions?: string; };
export type Schedule = { id: number; medicationId: number; time: string; frequencyType: 'DAILY' | 'HOURLY' | 'WEEKLY'; frequencyValue: number; daysOfWeek?: string; endDate?: string | null; };
export type IntakeLog = { id: number; medicationId: number; scheduledFor: string; action: 'TAKEN' | 'SKIPPED' | 'POSTPONED'; actionAt: string; };
export type IntakeLogWithName = { id: number; medicamento: string; dosis: string; horaPlaneada: string; horaTomada: string; fecha: string; estado: 'TAKEN' | 'SKIPPED' | 'POSTPONED'; };

// --- GESTIÓN DE LA BASE DE DATOS ---
export function getDBConnection() { return SQLite.openDatabaseAsync('pastillapp.db'); }

export async function createTables(db: SQLiteDatabase) {
  const setupQueries = `
    BEGIN TRANSACTION;
    CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT NOT NULL, apellido TEXT NOT NULL, email TEXT NOT NULL UNIQUE, telefono TEXT NOT NULL, fechaNacimiento TEXT, password_hash TEXT NOT NULL, createdAt TEXT NOT NULL DEFAULT (datetime('now', 'localtime')), direccion TEXT, contactoEmergencia TEXT, telefonoEmergencia TEXT, condicionesMedicas TEXT, alergias TEXT );
    CREATE TABLE IF NOT EXISTS medications ( id INTEGER PRIMARY KEY AUTOINCREMENT, userId INTEGER NOT NULL, name TEXT NOT NULL, dosage TEXT NOT NULL, quantity INTEGER NOT NULL, instructions TEXT, FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE );
    CREATE TABLE IF NOT EXISTS schedules ( id INTEGER PRIMARY KEY AUTOINCREMENT, medicationId INTEGER NOT NULL, time TEXT NOT NULL, frequencyType TEXT NOT NULL, frequencyValue INTEGER, daysOfWeek TEXT, endDate TEXT, FOREIGN KEY (medicationId) REFERENCES medications (id) ON DELETE CASCADE );
    CREATE TABLE IF NOT EXISTS intake_logs ( id INTEGER PRIMARY KEY AUTOINCREMENT, medicationId INTEGER NOT NULL, scheduledFor TEXT NOT NULL, action TEXT NOT NULL, actionAt TEXT NOT NULL, FOREIGN KEY (medicationId) REFERENCES medications (id) ON DELETE CASCADE );
    COMMIT;
  `;
  try {
    await db.execAsync(setupQueries);
  } catch (error) {
    console.error("Error creando las tablas", error);
  }
}

export async function initializeDatabase(): Promise<SQLiteDatabase | null> {
    try {
        const db = await getDBConnection();
        await createTables(db);
        return db;
    } catch (error) {
        console.error("Error inicializando la base de datos", error);
        return null;
    }
}

// --- OPERACIONES DE USUARIO ---
async function hashPassword(password: string): Promise<string> { return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password); }
export async function createUser(db: SQLiteDatabase, user: any) {
  const { nombre, apellido, email, telefono, fechaNacimiento, password_plaintext } = user;
  const password_hash = await hashPassword(password_plaintext);
  const insertQuery = `INSERT INTO users (nombre, apellido, email, telefono, fechaNacimiento, password_hash) VALUES (?, ?, ?, ?, ?, ?);`;
  try {
    const result = await db.runAsync(insertQuery, [nombre, apellido, email, telefono, fechaNacimiento || null, password_hash]);
    return result.lastInsertRowId;
  } catch (error) {
    console.error("Error al crear el usuario:", error);
    return null;
  }
}
export async function findUserByEmail(db: SQLiteDatabase, email: string): Promise<any> {
  const selectQuery = "SELECT * FROM users WHERE email = ?;";
  try {
    const user = await db.getFirstAsync(selectQuery, [email]);
    return user || null;
  } catch (error) {
    console.error("Error buscando usuario por email", error);
    return null;
  }
}
export async function verifyPassword(inputPassword: string, storedHash: string): Promise<boolean> {
  const inputHash = await hashPassword(inputPassword);
  return inputHash === storedHash;
}
export async function getUserById(db: SQLiteDatabase, userId: number): Promise<User | null> {
    const query = "SELECT id, nombre, apellido, email, telefono, fechaNacimiento, direccion, contactoEmergencia, telefonoEmergencia, condicionesMedicas, alergias FROM users WHERE id = ?;";
    try {
        const user = await db.getFirstAsync<User>(query, [userId]);
        return user || null;
    } catch (error) {
        console.error("Error obteniendo usuario por ID:", error);
        return null;
    }
}
export async function updateUserProfile(db: SQLiteDatabase, userId: number, profileData: Partial<User>): Promise<boolean> {
    const query = `
        UPDATE users SET
            nombre = ?, apellido = ?, fechaNacimiento = ?, telefono = ?, email = ?,
            direccion = ?, contactoEmergencia = ?, telefonoEmergencia = ?,
            condicionesMedicas = ?, alergias = ?
        WHERE id = ?;
    `;
    try {
        // Provide `null` as a default for any undefined or empty fields
        await db.runAsync(query, [
            profileData.nombre || '',
            profileData.apellido || '',
            profileData.fechaNacimiento || null,
            profileData.telefono || '',
            profileData.email || '',
            profileData.direccion || null,
            profileData.contactoEmergencia || null,
            profileData.telefonoEmergencia || null,
            profileData.condicionesMedicas || null,
            profileData.alergias || null,
            userId
        ]);
        return true;
    } catch (error) {
        console.error("Error actualizando el perfil:", error);
        return false;
    }
}

// --- OPERACIONES DE MEDICAMENTOS Y HORARIOS ---
export async function addMedicationWithSchedules(db: SQLiteDatabase, med: Omit<Medication, 'id'>, schedules: Omit<Schedule, 'id' | 'medicationId'>[]): Promise<number | null> {
    try {
        const medResult = await db.runAsync(`INSERT INTO medications (userId, name, dosage, quantity, instructions) VALUES (?, ?, ?, ?, ?);`, [med.userId, med.name, med.dosage, med.quantity, med.instructions || null]);
        const medicationId = medResult.lastInsertRowId;
        if (!medicationId) { throw new Error("No se pudo crear el medicamento"); }
        for (const schedule of schedules) {
            await db.runAsync(`INSERT INTO schedules (medicationId, time, frequencyType, frequencyValue, daysOfWeek, endDate) VALUES (?, ?, ?, ?, ?, ?);`, [medicationId, schedule.time, schedule.frequencyType, schedule.frequencyValue, schedule.daysOfWeek || null, schedule.endDate || null]);
        }
        return medicationId;
    } catch (error) {
        console.error("Error al añadir medicamento con horarios:", error);
        return null;
    }
}
export async function getMedicationsWithSchedules(db: SQLiteDatabase, userId: number): Promise<(Medication & { schedules: Schedule[] })[]> {
    try {
        const medications = await db.getAllAsync<Medication>("SELECT * FROM medications WHERE userId = ?;", [userId]);
        const medsWithSchedules = [];
        for (const med of medications) {
            const schedules = await db.getAllAsync<Schedule>("SELECT * FROM schedules WHERE medicationId = ?;", [med.id]);
            medsWithSchedules.push({ ...med, schedules: schedules || [] });
        }
        return medsWithSchedules;
    } catch (error) {
        console.error("Error obteniendo medicamentos con horarios:", error);
        return [];
    }
}
export async function getMedicationById(db: SQLiteDatabase, medId: number): Promise<(Medication & { schedules: Schedule[] }) | null> {
    try {
        const medication = await db.getFirstAsync<Medication>("SELECT * FROM medications WHERE id = ?;", [medId]);
        if (!medication) return null;
        const schedules = await db.getAllAsync<Schedule>("SELECT * FROM schedules WHERE medicationId = ? ORDER BY time ASC;", [medId]);
        return { ...medication, schedules: schedules || [] };
    } catch (error) {
        console.error("Error obteniendo medicamento por ID:", error);
        return null;
    }
}
export async function updateMedicationWithSchedules(db: SQLiteDatabase, medId: number, med: Partial<Omit<Medication, 'id' | 'userId'>>, schedules: Omit<Schedule, 'id' | 'medicationId'>[]): Promise<boolean> {
    try {
        await db.runAsync( `UPDATE medications SET name = ?, dosage = ?, quantity = ?, instructions = ? WHERE id = ?;`, [med.name || '', med.dosage || '', med.quantity || 0, med.instructions || null, medId] );
        await db.runAsync(`DELETE FROM schedules WHERE medicationId = ?;`, [medId]);
        for (const schedule of schedules) {
            await db.runAsync( `INSERT INTO schedules (medicationId, time, frequencyType, frequencyValue, daysOfWeek, endDate) VALUES (?, ?, ?, ?, ?, ?);`, [medId, schedule.time, schedule.frequencyType, schedule.frequencyValue, schedule.daysOfWeek || null, schedule.endDate || null] );
        }
        return true;
    } catch (error) {
        console.error("Error al actualizar el medicamento:", error);
        return false;
    }
}
export async function deleteMedication(db: SQLiteDatabase, medId: number): Promise<boolean> {
    try {
        await db.runAsync(`DELETE FROM medications WHERE id = ?;`, [medId]);
        return true;
    } catch (error) {
        console.error("Error al eliminar el medicamento:", error);
        return false;
    }
}

// OPERACIONES DE HISTORIAL
export async function logIntake(db: SQLiteDatabase, log: Omit<IntakeLog, 'id'>): Promise<number | null> {
    const insertQuery = `INSERT INTO intake_logs (medicationId, scheduledFor, action, actionAt) VALUES (?, ?, ?, ?);`;
    try {
        const result = await db.runAsync(insertQuery, [log.medicationId, log.scheduledFor, log.action, log.actionAt]);
        return result.lastInsertRowId;
    } catch (error) {
        console.error("Error al registrar la toma:", error);
        return null;
    }
}
export async function getIntakeLogsForUser(db: SQLiteDatabase, userId: number): Promise<IntakeLogWithName[]> {
    const query = `SELECT il.id, m.name as medicamento, m.dosage as dosis, il.scheduledFor as horaPlaneada, il.actionAt as horaTomada, date(il.actionAt) as fecha, il.action as estado FROM intake_logs il JOIN medications m ON il.medicationId = m.id WHERE m.userId = ? ORDER BY il.actionAt DESC;`;
    try {
        const logs = await db.getAllAsync<IntakeLogWithName>(query, [userId]);
        return logs || [];
    } catch (error) {
        console.error("Error obteniendo el historial de tomas:", error);
        return [];
    }
}