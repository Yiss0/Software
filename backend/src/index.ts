// backend/src/index.ts (CORREGIDO CON TIMEZONE)

import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import multer from 'multer';
import {
  PrismaClient,
  Medication,
  Schedule,
  MedicationType,
  AlertType,
} from "@prisma/client";
import bcrypt from "bcrypt";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

// Serve uploaded files statically under /uploads
app.use('/uploads', express.static('uploads'));

const prisma = new PrismaClient();

// Multer setup for profile image uploads
// Configure storage to preserve file extension
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (_req: any, file: any, cb: any) => {
    // Extract file extension from original name
    const ext = file.originalname.split('.').pop() || 'jpg';
    // Generate a unique name with extension
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${ext}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

const convertLocalTimeToUTCString = (localTime: string): string => {
  if (!/^\d{2}:\d{2}$/.test(localTime)) return localTime;
  const [hours, minutes] = localTime.split(':').map(Number);
  
  // Creamos una fecha *hoy* con esa hora local
  const date = new Date();
  date.setHours(hours, minutes, 0, 0); // Establece la hora local
  
  // Obtenemos las componentes UTC de esa fecha
  const utcHours = String(date.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
  
  return `${utcHours}:${utcMinutes}`;
};



// ================= Health, Auth, Users, Meds, Schedules... =================
// (Todas tus rutas desde /health hasta /intakes/pending se mantienen EXACTAMENTE IGUALES)
// ... (copia aquí tus rutas sin modificar) ...
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});
app.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password)
    return res.status(400).json({ error: "Email and password are required" });
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
    if (!user || !user.password)
      return res.status(404).json({ error: "Invalid credentials" });
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(404).json({ error: "Invalid credentials" });
    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(500).json({ error: "An unexpected error occurred." });
  }
});
app.post("/users/register", async (req: Request, res: Response) => {
  // 1. Añadimos 'birthDate' a la desestructuración
  const { firstName, lastName, email, phone, password, role, birthDate } = req.body;

  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Required fields are missing" });
  }

  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    const userRole = role === "CAREGIVER" ? "CAREGIVER" : "PATIENT";

    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone,
        password: passwordHash,
        role: userRole,
        
        // 2. Añadimos el campo birthDate
        // El frontend envía un string ISO (ej: "1990-01-20T03:00:00.000Z")
        // o 'undefined'.
        // new Date(stringISO) lo convierte a un objeto Date que Prisma entiende.
        // Si birthDate es undefined, new Date(undefined) es "Invalid Date",
        // así que usamos un ternario para pasar 'undefined' explícitamente.
        birthDate: birthDate ? new Date(birthDate) : undefined,
      },
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);

  } catch (error: any) {
    // Manejo de errores (ej. email duplicado)
    if (error?.code === 'P2002' && error?.meta?.target?.includes('email')) {
      return res.status(409).json({ error: "El correo electrónico ya está en uso." });
    }
    console.error("Error en /users/register:", error);
    res.status(500).json({ error: "No se pudo crear la cuenta." });
  }
});

app.get("/patients/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
});
// Actualizar perfil de paciente/usuario (PUT y PATCH soportados)
app.put("/patients/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    firstName,
    lastName,
    email,
    phone,
    birthDate,
    address,
    emergencyContact,
    emergencyPhone,
    medicalConditions,
    allergies,
  } = req.body as Partial<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    birthDate: string; // ISO
    address: string;
    emergencyContact: string;
    emergencyPhone: string;
    medicalConditions: string;
    allergies: string;
  }>;

  try {
    // Construir objeto 'data' sólo con las propiedades definidas
    const data: any = {};
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email.toLowerCase().trim();
    if (phone !== undefined) data.phone = phone;
  if (birthDate !== undefined) data.birthDate = birthDate ? new Date(birthDate) : null;
  if ((req.body as any).profileImageUrl !== undefined) data.profileImageUrl = (req.body as any).profileImageUrl;
    if (address !== undefined) data.address = address;
    if (emergencyContact !== undefined) data.emergencyContact = emergencyContact;
    if (emergencyPhone !== undefined) data.emergencyPhone = emergencyPhone;
    if (medicalConditions !== undefined) data.medicalConditions = medicalConditions;
    if (allergies !== undefined) data.allergies = allergies;

  const updated = await prisma.user.update({ where: { id }, data: (data as any) });
    const { password: _pw, ...userWithoutPassword } = updated as any;
    return res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Error en PUT /patients/${id}:`, error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado.' });
    // Conflicto en email
    if (error?.code === 'P2002') return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
    return res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
  }
});

// También aceptar PATCH por compatibilidad (actualización parcial)
app.patch("/patients/:id", async (req: Request, res: Response) => {
  // Reutilizamos la misma lógica que PUT
  const { id } = req.params;
  try {
    // Llamar al handler PUT simplificado: usar prisma.update directamente con el body
  const body = req.body || {};
  if (body.birthDate !== undefined) body.birthDate = body.birthDate ? new Date(body.birthDate) : null;
  if (body.profileImageUrl !== undefined) body.profileImageUrl = body.profileImageUrl;
  const updated = await prisma.user.update({ where: { id }, data: (body as any) });
    const { password: _pw, ...userWithoutPassword } = updated as any;
    return res.json(userWithoutPassword);
  } catch (error: any) {
    console.error(`Error en PATCH /patients/${id}:`, error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado.' });
    if (error?.code === 'P2002') return res.status(409).json({ error: 'El correo electrónico ya está en uso.' });
    return res.status(500).json({ error: 'No se pudo actualizar el perfil.' });
  }
});
app.post("/users/:id/push-token", async (req: Request, res: Response) => {
  const { id } = req.params;
  const { token } = req.body as { token?: string };
  if (!token) {
    return res.status(400).json({ error: "Token es requerido." });
  }
  try {
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { pushToken: token },
    });
    console.log(
      `[Push Token] Token guardado para usuario ${updatedUser.firstName}: ${token}`
    );
    res.json({ ok: true, message: "Token guardado." });
  } catch (error) {
    console.error("Error al guardar el push token:", error);
    res.status(500).json({ error: "No se pudo guardar el token." });
  }
});
app.post(
  "/patients/:patientId/medications",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const { name, dosage, quantity, presentation, instructions, color, type } =
      req.body as {
        name?: string;
        dosage?: string;
        quantity?: number;
        presentation?: string;
        instructions?: string;
        color?: string;
        type?: MedicationType;
      };
    if (!name) return res.status(400).json({ error: "Name is required" });
    if (type && !Object.values(MedicationType).includes(type)) {
      return res.status(400).json({ error: "Tipo de medicamento inválido." });
    }
    try {
      const med = await prisma.medication.create({
        data: {
          patientId,
          name,
          dosage,
          quantity,
          presentation,
          instructions,
          color,
          type: type || MedicationType.PILL,
        },
      });
      res.status(201).json(med);
    } catch (e: any) {
      res.status(400).json({ error: (e as Error).message });
    }
  }
);
app.get(
  "/patients/:patientId/medications",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const meds = await prisma.medication.findMany({
      where: { patientId, active: true, deletedAt: null },
    });
    res.json(meds);
  }
);
app.delete("/medications/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const med = await prisma.medication.update({
      where: { id },
      data: { active: false, deletedAt: new Date() },
    });
    res.json({ ok: true, medication: med });
  } catch {
    res.status(404).json({ error: "Not found" });
  }
});

/**
 * 1. OBTENER UN SOLO MEDICAMENTO (CON SUS HORARIOS)
 * * Usado para rellenar el formulario en la pantalla /edit-medication
 */
app.get("/medications/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const medication = await prisma.medication.findUnique({
      where: { id },
      include: { 
        // ¡Importante! Incluimos los horarios para poder editarlos también
        schedules: { 
          where: { active: true } 
        } 
      }, 
    });

    if (!medication) {
      return res.status(404).json({ error: "Medicamento no encontrado." });
    }

    res.json(medication);

  } catch (error) {
    console.error(`Error en GET /medications/${id}:`, error);
    res.status(500).json({ error: "No se pudo obtener el medicamento." });
  }
});


/**
 * 2. ACTUALIZAR UN MEDICAMENTO (Y SUS HORARIOS)
 * * Usado para guardar los cambios del formulario en /edit-medication
 */

// Primero, definimos un validador con 'zod' para los datos que esperamos
const updateScheduleSchema = z.object({
  time: z.string().regex(/^\d{2}:\d{2}$/, "Formato de hora inválido (HH:MM)"),
  frequencyType: z.string(),
  frequencyValue: z.number().optional().nullable(),
  daysOfWeek: z.string().optional().nullable(),
  alertType: z.nativeEnum(AlertType).optional().default("NOTIFICATION"),
});

const updateMedicationSchema = z.object({
  // Datos del medicamento
  medication: z.object({
    name: z.string().min(1, "Nombre es requerido"),
    dosage: z.string().optional().nullable(),
    quantity: z.number().optional().nullable(),
    presentation: z.string().optional().nullable(),
    instructions: z.string().optional().nullable(),
    color: z.string().optional().nullable(),
    type: z.nativeEnum(MedicationType).optional().default("PILL"),
  }),
  // Array de horarios
  schedules: z.array(updateScheduleSchema),
});


app.put("/medications/:id", async (req: Request, res: Response) => {
  const { id } = req.params;

  // 1. Validar los datos del body con Zod
  const validation = updateMedicationSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({ error: validation.error.flatten() });
  }

  const { medication, schedules } = validation.data;

  try {
    // 2. Usar una transacción para actualizar todo o nada
    const updatedMedication = await prisma.$transaction(async (tx) => {
      
      // 2a. Actualizar los datos principales del medicamento
      const med = await tx.medication.update({
        where: { id },
        data: {
          name: medication.name,
          dosage: medication.dosage,
          quantity: medication.quantity,
          presentation: medication.presentation,
          instructions: medication.instructions,
          color: medication.color,
          type: medication.type,
        },
      });

      // 2b. Borrar TODOS los horarios antiguos de este medicamento
      await tx.schedule.deleteMany({
        where: { medicationId: id },
      });

      // 2c. Crear los NUEVOS horarios que vienen del frontend
      for (const s of schedules) {
        // ¡IMPORTANTE! Convertimos la hora local del form a UTC antes de guardar
        const utcTimeString = convertLocalTimeToUTCString(s.time);

        await tx.schedule.create({
          data: {
            medicationId: id,
            time: utcTimeString, // Guardamos en UTC
            frequencyType: s.frequencyType,
            frequencyValue: s.frequencyValue,
            daysOfWeek: s.daysOfWeek,
            alertType: s.alertType,
          },
        });
      }

      return med;
    });

    // 3. Si todo salió bien, enviar la respuesta
    res.json(updatedMedication);

  } catch (error: any) {
    console.error(`Error en PUT /medications/${id}:`, error);
    if (error?.code === 'P2025') { // Error de Prisma por no encontrar el 'id'
       return res.status(404).json({ error: "Medicamento no encontrado." });
    }
    res.status(500).json({ error: "No se pudo actualizar el medicamento." });
  }
});

// ===================================================================
// ============= 🚀 FIN DE NUEVOS ENDPOINTS (EDITAR) ================
// ===================================================================

app.post("/schedules", async (req: Request, res: Response) => {
  const {
    medicationId,
    time,
    frequencyType,
    frequencyValue,
    daysOfWeek,
    endDate,
    alertType,
  } = req.body as {
    medicationId?: string;
    time?: string;
    frequencyType?: string;
    frequencyValue?: number;
    daysOfWeek?: string;
    endDate?: string;
    alertType?: AlertType;
  };
  if (!medicationId || !time || !frequencyType)
    return res.status(400).json({ error: "Missing fields" });
  if (alertType && !Object.values(AlertType).includes(alertType)) {
    return res.status(400).json({ error: "Tipo de alerta inválido." });
  }
  try {
    const schedule = await prisma.schedule.create({
      data: {
        medicationId,
        time,
        frequencyType,
        frequencyValue,
        daysOfWeek,
        endDate,
        alertType: alertType || AlertType.NOTIFICATION,
      },
    });
    res.status(201).json(schedule);
  } catch (e: any) {
    res.status(400).json({ error: (e as Error).message });
  }
});
app.get(
  "/medications/:medId/schedules",
  async (req: Request, res: Response) => {
    const { medId } = req.params;
    const schedules = await prisma.schedule.findMany({
      where: { medicationId: medId, active: true },
    });
    res.json(schedules);
  }
);
app.post("/intakes", async (req: Request, res: Response) => {
  const { medicationId, scheduleId, scheduledFor, action, actionAt, note } =
    req.body as {
      medicationId?: string;
      scheduleId?: string;
      scheduledFor?: string;
      action?: string;
      actionAt?: string;
      note?: string;
    };
  if (!medicationId || !scheduledFor || !action || !actionAt)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const scheduledForDate = new Date(scheduledFor);
    const intake = await prisma.intakeLog.upsert({
      where: {
        medicationId_scheduledFor: {
          medicationId: medicationId,
          scheduledFor: scheduledForDate,
        },
      },
      update: {
        action: action,
        actionAt: new Date(actionAt),
        note: note,
      },
      create: {
        medicationId: medicationId,
        scheduleId: scheduleId,
        scheduledFor: scheduledForDate,
        action: action,
        actionAt: new Date(actionAt),
        note: note,
      },
    });
    res.status(201).json(intake);
  } catch (e: any) {
    console.error("Error en POST /intakes (upsert):", e.message);
    res.status(400).json({ error: (e as Error).message });
  }
});
app.get("/patients/:patientId/intakes", async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: patientId } });
    if (!user) return res.status(404).json({ error: "Patient not found" });
    const intakes = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId },
        scheduledFor: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: { medication: true },
      orderBy: { actionAt: "desc" },
    });
    res.json(intakes);
  } catch (e: any) {
    res.status(500).json({ error: (e as Error).message });
  }
});
app.post("/intakes/pending", async (req: Request, res: Response) => {
  const { medicationId, scheduleId, scheduledFor } = req.body as {
    medicationId?: string;
    scheduleId?: string;
    scheduledFor?: string;
  };
  if (!medicationId || !scheduleId || !scheduledFor) {
    return res
      .status(400)
      .json({
        error: "Faltan campos (medicationId, scheduleId, scheduledFor)",
      });
  }
  try {
    const scheduledForDate = new Date(scheduledFor);
    const intake = await prisma.intakeLog.upsert({
      where: {
        medicationId_scheduledFor: {
          medicationId: medicationId,
          scheduledFor: scheduledForDate,
        },
      },
      update: {},
      create: {
        medicationId: medicationId,
        scheduleId: scheduleId,
        scheduledFor: scheduledForDate,
        action: "PENDING",
      },
    });
    res.status(201).json(intake);
  } catch (e: any) {
    console.error("Error al crear intake 'PENDING':", e.message);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ================= Lógica next-dose (INICIO DE SECCIÓN CORREGIDA) =================

/**
 * --- LÓGICA DE TIMEZONE CORREGIDA ---
 * Calcula la próxima fecha de disparo (en UTC) basándose en la hora local guardada
 * y el offset de zona horaria del usuario.
 */
function getNextTriggerDate(
  schedule: Schedule,
  tzOffsetMinutes: number // Ej: 180 para UTC-3
): Date | null {
  const [localHour, localMinute] = schedule.time.split(":").map(Number);
  const now = new Date(); // Hora actual del servidor (UTC)

  // 1. Obtener la hora actual en la zona horaria del usuario
  // 'Local = UTC - offset'
  const nowInUserTZ = new Date(now.getTime() - tzOffsetMinutes * 60000);

  // 2. Crear la próxima fecha de disparo en la zona horaria del usuario
  const nextDateInUserTZ = new Date(nowInUserTZ.getTime());
  nextDateInUserTZ.setUTCHours(localHour, localMinute, 0, 0); // Establece la hora local (representada como UTC)

  switch (schedule.frequencyType) {
    case "DAILY": {
      // Si la hora ya pasó hoy (en el TZ del usuario), programar para mañana (en el TZ del usuario)
      if (nextDateInUserTZ <= nowInUserTZ) {
        nextDateInUserTZ.setUTCDate(nextDateInUserTZ.getUTCDate() + 1);
      }
      break;
    }
    case "HOURLY": {
      if (!schedule.frequencyValue) return null;
      // Si la hora de inicio ya pasó, calculamos la siguiente ocurrencia sumando horas
      while (nextDateInUserTZ <= nowInUserTZ) {
        nextDateInUserTZ.setUTCHours(
          nextDateInUserTZ.getUTCHours() + schedule.frequencyValue
        );
      }
      break;
    }
    case "WEEKLY": {
      const days = (schedule.daysOfWeek || "")
        .split(",")
        .map(Number)
        .filter((n) => !isNaN(n));
      if (days.length === 0) return null;

      // Buscamos en los próximos 7 días (en el TZ del usuario)
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date(nowInUserTZ.getTime());
        checkDate.setUTCDate(nowInUserTZ.getUTCDate() + i);
        const dow = checkDate.getUTCDay(); // Día de la semana en el TZ del usuario

        if (days.includes(dow)) {
          const candidate = new Date(checkDate);
          candidate.setUTCHours(localHour, localMinute, 0, 0);
          if (candidate > nowInUserTZ) {
            // Encontramos la próxima fecha válida en el TZ del usuario
            // Convertir de vuelta a UTC real para la respuesta
            // 'UTC = Local + offset'
            return new Date(candidate.getTime() + tzOffsetMinutes * 60000);
          }
        }
      }
      return null; // No se encontró en los próximos 7 días
    }
    default:
      return null;
  }

  // 3. Convertir la fecha de disparo (del TZ del usuario) de vuelta a UTC real
  // 'UTC = Local + offset'
  const triggerDateUTC = new Date(
    nextDateInUserTZ.getTime() + tzOffsetMinutes * 60000
  );
  return triggerDateUTC;
}

interface NextDoseResponse {
  medication: Medication;
  schedule: Schedule;
  triggerDate: Date;
  isPostponed?: boolean;
}

/**
 * --- FUNCIÓN COMPARTIDA (ACTUALIZADA) ---
 * Acepta 'tzOffsetMinutes' para el cálculo de fechas.
*/
async function getUpcomingDoses(
  patientId: string,
  tzOffsetMinutes: number // Ej: 180
): Promise<NextDoseResponse[]> {
  const now = new Date(); // Hora actual del servidor (UTC)

  // 1. Obtener medicamentos y horarios activos
  const meds = await prisma.medication.findMany({
    where: { patientId, active: true, deletedAt: null },
    include: { schedules: { where: { active: true } } },
  });

  // 2. Definir "hoy" en la zona horaria del usuario
  const nowInUserTZ = new Date(now.getTime() - tzOffsetMinutes * 60000);
  const startOfDayUserTZ = new Date(nowInUserTZ.getTime());
  startOfDayUserTZ.setUTCHours(0, 0, 0, 0);
  const endOfDayUserTZ = new Date(nowInUserTZ.getTime());
  endOfDayUserTZ.setUTCHours(23, 59, 59, 999);

  // 3. Convertir "hoy" (del usuario) de vuelta a UTC para la consulta
  const startOfDayUTC = new Date(
    startOfDayUserTZ.getTime() + tzOffsetMinutes * 60000
  );
  const endOfDayUTC = new Date(
    endOfDayUserTZ.getTime() + tzOffsetMinutes * 60000
  );

  // 4. Obtener los registros de "hoy" (del usuario)
  const todaysLogs = await prisma.intakeLog.findMany({
    where: {
      medication: { patientId },
      // Comparamos contra las fechas UTC que definen "hoy" para el usuario
      scheduledFor: {
        gte: startOfDayUTC,
        lte: endOfDayUTC,
      },
    },
  });

  const upcoming: NextDoseResponse[] = [];
  for (const med of meds) {
    for (const s of med.schedules) {
      // 5. Obtener la próxima fecha de disparo (ya en UTC correcto)
      const trigger = getNextTriggerDate(s, tzOffsetMinutes);
      if (!trigger) continue; // No hay próxima fecha válida

      // 6. Buscar si ya existe un registro para esa dosis
      const logMatch = todaysLogs.find(
        (l) =>
          l.medicationId === med.id &&
          new Date(l.scheduledFor).getTime() === trigger.getTime()
      );

      // --- INICIO DE LA LÓGICA CORREGIDA ---
      // 7. Decidir si incluir esta dosis
      
      if (logMatch) {
        // Encontramos un registro para hoy
        if (logMatch.action === "CONFIRMED" || logMatch.action === "SKIPPED") {
          // Ya se tomó o se omitió. No la incluimos.
          continue;

        } else if (logMatch.action === "POSTPONED" && logMatch.actionAt) {
          // Fue pospuesta. Calculamos la nueva hora.
          const postponed = new Date(
            new Date(logMatch.actionAt).getTime() + 10 * 60000 // 10 min
          );
          if (postponed > now) {
            // Si la nueva hora pospuesta sigue en el futuro, la añadimos.
            upcoming.push({
              medication: med,
              schedule: s,
              triggerDate: postponed,
              isPostponed: true,
            });
          }

        } else if (logMatch.action === "PENDING") {
          // Está PENDIENTE (ej. notificación enviada). ¡Debemos incluirla!
          upcoming.push({
            medication: med,
            schedule: s,
            triggerDate: trigger,
          });
        }
      } else {
        // No hay NINGÚN registro (logMatch es nulo).
        // Es una dosis futura que aún no tiene log. ¡La incluimos!
        upcoming.push({
          medication: med,
          schedule: s,
          triggerDate: trigger,
        });
      }
      // --- FIN DE LA LÓGICA CORREGIDA ---
    }
  }

  // 8. Ordenar todas las dosis futuras de más cercana a más lejana
  upcoming.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
  return upcoming;
}

/**
 * --- RUTA REFACTORIZADA (ACTUALIZADA) ---
 * Ahora lee 'tzOffsetMinutes' del query string.
 */
app.get(
  "/patients/:patientId/next-dose",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    // Lee el offset del query, si no existe, usa 0 (UTC)
    const tzOffsetMinutes = parseInt(req.query.tzOffsetMinutes as string) || 0;
    
    console.log(`[next-dose] Recibido offset: ${tzOffsetMinutes}`);

    try {
      const upcoming = await getUpcomingDoses(patientId, tzOffsetMinutes);
      if (!upcoming.length) return res.json(null);
      
      console.log(" backend | Enviando next-dose:", upcoming[0].triggerDate);
      res.json(upcoming[0]);
    } catch (e) {
      console.error("Error next-dose:", e);
      res.status(500).json({ error: "No se pudo calcular la próxima dosis." });
    }
  }
);

/**
 * --- NUEVA RUTA (ACTUALIZADA) ---
 * Ahora lee 'tzOffsetMinutes' del query string.
 */
app.get(
  "/patients/:patientId/remaining-doses-today",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const now = new Date();
    // Lee el offset del query, si no existe, usa 0 (UTC)
    const tzOffsetMinutes = parseInt(req.query.tzOffsetMinutes as string) || 0;

    console.log(`[remaining-doses] Recibido offset: ${tzOffsetMinutes}`);

    try {
      // 1. Obtiene *todas* las dosis futuras (ya en UTC correcto)
      const upcoming = await getUpcomingDoses(patientId, tzOffsetMinutes);

      // 2. Define el fin del día en el TZ del usuario
      const nowInUserTZ = new Date(now.getTime() - tzOffsetMinutes * 60000);
      const endOfDayUserTZ = new Date(nowInUserTZ.getTime());
      endOfDayUserTZ.setUTCHours(23, 59, 59, 999);
      
      // 3. Convertir de vuelta a UTC
      const endOfDayUTC = new Date(
        endOfDayUserTZ.getTime() + tzOffsetMinutes * 60000
      );

      // 4. Filtra la lista para incluir solo las dosis de "hoy" (del usuario)
      const remainingToday = upcoming.filter(
        (dose) => dose.triggerDate <= endOfDayUTC
      );

      res.json(remainingToday);
    } catch (e) {
      console.error("Error remaining-doses-today:", e);
      res.status(500).json({
        error: "No se pudieron calcular las dosis restantes de hoy.",
      });
    }
  }
);
// ================= (FIN DE SECCIÓN CORREGIDA) =================

// ================= Cuidadores, Chatbot, Cron, Server... =================
// (El resto de tus rutas: /caregivers, /chatbot, /cron, app.listen, etc. 
//  se mantienen EXACTAMENTE IGUALES a como las tenías)
// ... (copia aquí el resto de tus rutas sin modificar) ...
// ... (cuidadores) ...
const caregiverCreateSchema = z.object({
  firstName: z.string().min(1, "firstName requerido"),
  lastName: z.string().min(1, "lastName requerido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(),
});
const caregiverLinkSchema = z.object({
  patientId: z.string().min(1, "patientId requerido"),
  relation: z.string().optional(),
});
app.post("/caregivers", async (req: Request, res: Response) => {
  const parsed = caregiverCreateSchema.safeParse(req.body);
  if (!parsed.success)
    return res.status(400).json({ error: parsed.error.flatten() });
  const { firstName, lastName, email, phone, password } = parsed.data;
  try {
    const passwordHash = password ? await bcrypt.hash(password, 10) : null;
    const caregiver = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email?.toLowerCase().trim(),
        phone,
        password: passwordHash || undefined,
        role: "CAREGIVER",
      },
    });
    const { password: _pw, ...safe } = caregiver;
    res.status(201).json(safe);
  } catch (e: any) {
    if (e?.code === "P2002")
      return res.status(409).json({ error: "Email already exists" });
    res.status(500).json({ error: "Internal error" });
  }
});
app.get("/caregivers/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const cg = await prisma.user.findFirst({ where: { id, role: "CAREGIVER" } });
  if (!cg) return res.status(404).json({ error: "Caregiver not found" });
  const { password: _pw, ...safe } = cg;
  res.json(safe);
});
app.post(
  "/caregivers/:caregiverId/patients",
  async (req: Request, res: Response) => {
    const { caregiverId } = req.params;
    const parsed = caregiverLinkSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const { patientId, relation } = parsed.data;
    const caregiver = await prisma.user.findFirst({
      where: { id: caregiverId, role: "CAREGIVER" },
    });
    if (!caregiver)
      return res.status(404).json({ error: "Caregiver not found" });
    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: "PATIENT" },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    try {
      const link = await prisma.patientCaregiver.create({
        data: { caregiverId, patientId, relation },
      });
      res.status(201).json(link);
    } catch (e: any) {
      if (e?.code === "P2002")
        return res.status(409).json({ error: "Link already exists" });
      res.status(500).json({ error: "Internal error" });
    }
  }
);
app.get(
  "/caregivers/:caregiverId/patients/:patientId/dashboard",
  async (req: Request, res: Response) => {
    const { caregiverId, patientId } = req.params;
    try {
      const link = await prisma.patientCaregiver.findUnique({
        where: {
          patientId_caregiverId: {
            patientId,
            caregiverId,
          },
        },
      });
      if (!link) {
        return res
          .status(403)
          .json({
            error: "Acceso denegado: No tienes permiso para ver a este paciente.",
          });
      }
      const patientData = await prisma.user.findUnique({
        where: { id: patientId },
        include: {
          medications: {
            where: { active: true, deletedAt: null },
            include: {
              schedules: {
                where: { active: true },
              },
            },
            orderBy: { name: "asc" },
          },
        },
      });
      if (!patientData) {
        return res.status(404).json({ error: "Paciente no encontrado." });
      }
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setUTCHours(23, 59, 59, 999);
      const todaysIntakes = await prisma.intakeLog.findMany({
        where: {
          medication: { patientId },
          actionAt: { gte: startOfDay, lte: endOfDay },
        },
        include: { medication: { select: { name: true, dosage: true } } },
        orderBy: { actionAt: "desc" },
      });
      const { password, ...safePatientData } = patientData;
      res.json({
        patient: safePatientData,
        todaysIntakes,
      });
    } catch (error) {
      console.error("Error al obtener el dashboard del paciente:", error);
      res.status(500).json({ error: "Ocurrió un error en el servidor." });
    }
  }
);
app.post(
  "/caregivers/:caregiverId/link-patient",
  async (req: Request, res: Response) => {
    const { caregiverId } = req.params;
    const { patientEmail } = req.body;
    if (!patientEmail)
      return res.status(400).json({ error: "Email del paciente requerido" });
    try {
      const patient = await prisma.user.findUnique({
        where: { email: patientEmail.toLowerCase().trim() },
      });
      if (!patient || patient.role !== "PATIENT") {
        return res
          .status(404)
          .json({ error: "No se encontró un paciente con ese email." });
      }
      const link = await prisma.patientCaregiver.create({
        data: {
          caregiverId: caregiverId,
          patientId: patient.id,
        },
      });
      res.status(201).json(link);
    } catch (e: any) {
      if (e?.code === "P2002") {
        return res
          .status(409)
          .json({ error: "Ya estás vinculado a este paciente." });
      }
      res.status(500).json({ error: "Error interno del servidor." });
    }
  }
);
app.get(
  "/caregivers/:caregiverId/patients",
  async (req: Request, res: Response) => {
    const { caregiverId } = req.params;
    const caregiver = await prisma.user.findFirst({
      where: { id: caregiverId, role: "CAREGIVER" },
   });
    if (!caregiver)
      return res.status(404).json({ error: "Caregiver not found" });
    const links = await prisma.patientCaregiver.findMany({
      where: { caregiverId },
      include: { patient: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(links);
  }
);
app.get(
  "/patients/:patientId/caregivers",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const patient = await prisma.user.findFirst({
      where: { id: patientId, role: "PATIENT" },
    });
    if (!patient) return res.status(404).json({ error: "Patient not found" });
    const links = await prisma.patientCaregiver.findMany({
      where: { patientId },
      include: { caregiver: true },
      orderBy: { createdAt: "desc" },
    });
    res.json(links);
  }
);
app.delete(
  "/caregivers/:caregiverId/patients/:patientId",
  async (req: Request, res: Response) => {
    const { caregiverId, patientId } = req.params;
    try {
      await prisma.patientCaregiver.delete({
        where: { patientId_caregiverId: { patientId, caregiverId } },
      });
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "Link not found" });
    }
  }
);
// ... (sincronización) ...
app.post("/sync/full", async (req: Request, res: Response) => {
  const { users, medications, schedules, intakeLogs } = req.body as any;
  if (!users || !medications || !schedules || !intakeLogs) {
    return res
      .status(400)
      .json({ error: "Faltan datos en el payload de sincronización." });
   }
  try {
    await prisma.$transaction(async (tx) => {
      await tx.intakeLog.deleteMany({});
      await tx.schedule.deleteMany({});
      await tx.medication.deleteMany({});
      await tx.user.deleteMany({});
      const userMap = new Map<number, string>();
      const medMap = new Map<number, string>();
      for (const u of users) {
        const newUser = await tx.user.create({
          data: {
            firstName: u.nombre,
            lastName: u.apellido,
            email: u.email,
            phone: u.telefono,
            birthDate: u.fechaNacimiento,
            address: u.direccion,
            emergencyContact: u.contactoEmergencia,
            emergencyPhone: u.telefonoEmergencia,
            medicalConditions: u.condicionesMedicas,
            allergies: u.alergias,
            role: "PATIENT",
          },
        });
        userMap.set(u.id, newUser.id);
      }
      for (const m of medications) {
        const pid = userMap.get(m.userId);
        if (!pid) continue;
        const newMed = await tx.medication.create({
          data: {
            patientId: pid,
            name: m.name,
            dosage: m.dosage,
            quantity: m.quantity,
            instructions: m.instructions,
            presentation: m.presentation,
            color: m.color,
          },
        });
        medMap.set(m.id, newMed.id);
      }
      for (const s of schedules) {
        const mid = medMap.get(s.medicationId);
        if (!mid) continue;
        await tx.schedule.create({
          data: {
            medicationId: mid,
            time: s.time,
            frequencyType: s.frequencyType,
            frequencyValue: s.frequencyValue,
            daysOfWeek: s.daysOfWeek,
            endDate: s.endDate,
         },
        });
      }
      for (const l of intakeLogs) {
        const mid = medMap.get(l.medicationId);
        if (!mid) continue;
        await tx.intakeLog.create({
          data: {
            medicationId: mid,
           scheduledFor: new Date(l.scheduledFor),
            action: l.action,
            actionAt: new Date(l.actionAt),
            note: l.note,
          },
        });
      }
    });
    res
      .status(200)
      .json({ message: "Sincronización completada exitosamente." });
  } catch (error) {
    console.error("Error durante la sincronización:", error);
    res
      .status(500)
      .json({ error: "Ocurrió un error durante la sincronización." });
  }
});

// ================= CHATBOT (SECCIÓN CORREGIDA) =================

// 1. Importamos las funciones NUEVAS y los TIPOS del servicio
import {
  analyzeChatIntent,
  extractMedicationDetails,
  getConversationalResponse,
  MedicationDetails,
  IntentResponse,
  validateMedicationDetails,
  parseTimeToHHMM
} from "./services/chatbotService";

app.post("/chatbot/interpret", async (req: Request, res: Response) => {
  const { message, patientId, tzOffsetMinutes = 0 } = req.body as {
    message?: string;
    patientId?: string;
    tzOffsetMinutes?: number; 
  };

  if (!message?.trim() || !patientId?.trim()) {
    return res.status(400).json({ 
      error: "message y patientId son requeridos.",
      response: "Necesito un mensaje y tu ID de paciente para ayudarte."
    });
  }

  try {
    console.log(`[chatbot] Procesando mensaje de ${patientId}: "${message}"`);
    
    // 1. Clasificar la intención
    const intentResponse: IntentResponse = await analyzeChatIntent(message);
    console.log(`[chatbot] Intención: ${intentResponse.intent} (confianza: ${intentResponse.confidence})`);

    switch (intentResponse.intent) {
      // ===== AGREGAR MEDICAMENTO =====
      case "ADD_MEDICINE": {
        console.log('[chatbot] Iniciando flujo: AGREGAR MEDICAMENTO');
        
        // Extraer detalles del medicamento
        const details = await extractMedicationDetails(message);
        
        if (!details) {
          return res.json({
            response: "No capté bien los detalles. Por favor, dime el nombre del medicamento y a qué hora debes tomarlo. Ejemplo: 'Paracetamol 500mg cada 8 horas'."
          });
        }

        // Validar que los detalles sean completos
        const validation = validateMedicationDetails(details);
        if (!validation.valid) {
          console.warn('[chatbot] Validación fallida:', validation.errors);
          return res.json({
            response: `Necesito más información: ${validation.errors.join(', ')}. ¿Podrías ser más específico?`
          });
        }

        const { medication: medData, schedules: schedulesData } = details;

        // Crear el medicamento
        const newMedication = await prisma.medication.create({
          data: {
            patientId,
            name: medData.name.trim(),
            dosage: medData.dosage?.trim(),
            quantity: medData.quantity || 30,
            presentation: medData.instructions?.trim(),
            instructions: medData.instructions?.trim(),
            type: medData.type || 'PILL',
          },
        });

        console.log(`[chatbot] Medicamento creado: ${newMedication.name} (${newMedication.id})`);

        // Crear los horarios
        let createdSchedules = 0;
        for (const schedule of schedulesData) {
          const utcTimeString = convertLocalTimeToUTCString(schedule.time);
          await prisma.schedule.create({
            data: {
              medicationId: newMedication.id,
              time: utcTimeString,
              frequencyType: schedule.frequencyType || 'DAILY',
              frequencyValue: schedule.frequencyValue,
              daysOfWeek: schedule.daysOfWeek,
              alertType: schedule.alertType || 'NOTIFICATION',
            },
          });
          createdSchedules++;
        }

        console.log(`[chatbot] ${createdSchedules} horario(s) creado(s)`);

        // Respuesta amigable
        const doseInfo = medData.dosage ? ` de ${medData.dosage}` : '';
        const scheduleInfo = schedulesData.length === 1 
          ? `a las ${schedulesData[0].time}`
          : `en ${schedulesData.length} horarios diferentes`;
        
        return res.json({
          response: `✅ ¡Perfecto! He registrado **${newMedication.name}**${doseInfo} ${scheduleInfo}. Recibirás recordatorios puntualmente.`,
          success: true,
          medicationId: newMedication.id,
          schedulesCount: createdSchedules
        });
      }

      // ===== VER HORARIOS/MEDICAMENTOS =====
      case "VIEW_SCHEDULE": {
        console.log('[chatbot] Iniciando flujo: VER HORARIOS');
        
        const medications = await prisma.medication.findMany({
          where: {
            patientId,
            active: true,
            deletedAt: null
          },
          include: {
            schedules: {
              where: { active: true }
            }
          }
        });

        if (medications.length === 0) {
          return res.json({
            response: "No tienes medicamentos registrados. ¿Deseas agregar uno? Cuéntame: nombre, dosis y horario."
          });
        }

        // Construir resumen
        const summary = medications.map(med => 
          `• **${med.name}**${med.dosage ? ` (${med.dosage})` : ''}: ${med.schedules.length} horario(s) (${med.schedules.map(s => s.time).join(', ')})`
        ).join('\n');

        return res.json({
          response: `Tienes ${medications.length} medicamento(s) activo(s):\n\n${summary}`,
          medications: medications.length,
          success: true
        });
      }

      // ===== CONFIRMAR TOMA =====
      case "CONFIRM_INTAKE": {
        console.log('[chatbot] Iniciando flujo: CONFIRMAR TOMA');
        
        // Buscar el medicamento mencionado
        const medicationName = intentResponse.details?.toLowerCase().trim();
        
        if (!medicationName) {
          return res.json({
            response: "¿Cuál medicamento te tomaste? Cuéntame el nombre y me registro la confirmación."
          });
        }

        const medication = await prisma.medication.findFirst({
          where: {
            patientId,
            name: { contains: medicationName, mode: 'insensitive' },
            active: true,
            deletedAt: null
          }
        });

        if (!medication) {
          return res.json({
            response: `No encontré un medicamento con el nombre "${medicationName}". ¿Podrías darme el nombre exacto?`
          });
        }

        // Registrar la toma de hoy
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        await prisma.intakeLog.upsert({
          where: {
            medicationId_scheduledFor: {
              medicationId: medication.id,
              scheduledFor: today
            }
          },
          update: {
            action: 'CONFIRMED',
            actionAt: now
          },
          create: {
            medicationId: medication.id,
            scheduledFor: today,
            action: 'CONFIRMED',
            actionAt: now
          }
        });

        console.log(`[chatbot] Toma confirmada: ${medication.name} para paciente ${patientId}`);

        return res.json({
          response: `✅ Perfecto, he registrado que tomaste **${medication.name}** hoy a las ${now.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}. ¡Excelente!`,
          success: true,
          medicationId: medication.id
        });
      }

      // ===== SALUDOS =====
      case "GREETING": {
        console.log('[chatbot] Respuesta: SALUDO');
        const conversationalResponse = await getConversationalResponse(message);
        return res.json({
          response: conversationalResponse,
          success: true
        });
      }

      // ===== DESPEDIDAS =====
      case "FAREWELL": {
        console.log('[chatbot] Respuesta: DESPEDIDA');
        const goodbyeResponses = [
          "¡Hasta luego! Recuerda tomar tus medicamentos a tiempo. 💊",
          "¡Nos vemos! Cuídate mucho. 👋",
          "¡Adiós! Estaré aquí cuando me necesites. 😊"
        ];
        return res.json({
          response: goodbyeResponses[Math.floor(Math.random() * goodbyeResponses.length)],
          success: true
        });
      }

      // ===== PEDIR AYUDA =====
      case "HELP": {
        console.log('[chatbot] Respuesta: AYUDA');
        return res.json({
          response: `¡Claro! Puedo ayudarte con:
• **Agregar medicamentos**: "Quiero agregar paracetamol cada 8 horas"
• **Ver mis medicamentos**: "¿Qué medicamentos tengo?"
• **Confirmar que tomé un medicamento**: "Ya me tomé la pastilla"
¿Qué necesitas?`,
          success: true
        });
      }

      // ===== DESCONOCIDO =====
      case "UNKNOWN":
      default: {
        console.log('[chatbot] Respuesta: NO ENTENDIDO');
        const fallbackResponse = await getConversationalResponse(message);
        return res.json({
          response: fallbackResponse || "Perdón, no estoy seguro de haber entendido. ¿Puedo ayudarte con algo específico sobre tus medicamentos?",
          success: false
        });
      }
    }
  } catch (error) {
    console.error('[chatbot] Error procesando mensaje:', error instanceof Error ? error.message : error);
    res.status(500).json({ 
      error: "Ocurrió un error procesando tu solicitud",
      response: "Disculpa, algo salió mal. Por favor, intenta de nuevo."
    });
  }
});// ================= FIN CHATBOT =================

// ... (cron job) ...
app.post("/cron/mark-skipped", async (req: Request, res: Response) => {
  console.log("[Cron Job] Ejecutando tarea para marcar tomas omitidas...");
  try {
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const intakesToSkip = await prisma.intakeLog.findMany({
      where: {
        action: "PENDING",
        scheduledFor: {
          lt: tenMinutesAgo,
        },
      },
    });
    if (intakesToSkip.length === 0) {
      console.log("[Cron Job] No se encontraron tomas para omitir.");
      return res.status(200).json({ message: "No intakes to skip." });
    }
    const skippedCount = await prisma.intakeLog.updateMany({
      where: {
        id: {
          in: intakesToSkip.map((intake) => intake.id),
        },
      },
      data: {
        action: "SKIPPED",
        actionAt: new Date(),
      },
    });
    console.log(`[Cron Job] ${skippedCount.count} tomas marcadas como SKIPPED.`);
    res.status(200).json({ message: `Skipped ${skippedCount.count} intakes.` });
  } catch (error) {
    console.error("[Cron Job] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});
// ... (server listen) ...
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

// Endpoint to upload a profile image (multipart/form-data)
app.post('/patients/:id/profile-image', upload.single('profileImage'), async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const file = (req as any).file;
    if (!file) return res.status(400).json({ error: 'No file uploaded' });
    
    // Normalize path (Windows uses backslashes, need forward slashes for URLs)
    const normalizedPath = file.path.replace(/\\/g, '/');
    
    // Store ONLY the relative path, not the full URL
    // This way, the path works regardless of server address
    const relativePath = normalizedPath; // e.g., "uploads/1c69d50324f4.jpg"
    
    console.log(`[Profile Image Upload] Saving to user ${id}: ${relativePath}`);
    
    // Save to user
    const updated = await prisma.user.update({ 
      where: { id }, 
      data: ({ profileImageUrl: relativePath } as any) 
    });
    
    console.log(`[Profile Image Upload] Success. profileImageUrl set to: ${(updated as any).profileImageUrl || 'NULL'}`);
    
    const { password: _pw, ...userWithoutPassword } = updated as any;
    return res.json(userWithoutPassword);
  } catch (error: any) {
    console.error('Error uploading profile image:', error);
    if (error?.code === 'P2025') return res.status(404).json({ error: 'Usuario no encontrado.' });
    return res.status(500).json({ error: 'No se pudo subir la imagen.' });
  }
});