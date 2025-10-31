import express, { Request, Response } from "express";
import cors from "cors";
import "dotenv/config";
import { PrismaClient, Medication, Schedule, MedicationType, AlertType } from "@prisma/client";import bcrypt from "bcrypt";
import { z } from "zod";

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// ================= Health =================
app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ================= Auth/Login =================
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

// ================= Pacientes =================
app.post("/users/register", async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password, role } = req.body; // <-- Recibimos el rol
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: "Required fields are missing" });
  }
  const saltRounds = 10;
  const passwordHash = await bcrypt.hash(password, saltRounds);

  // Determinamos el rol: si nos lo envían y es 'CAREGIVER', lo usamos. Si no, 'PATIENT'.
  const userRole = role === "CAREGIVER" ? "CAREGIVER" : "PATIENT";

  const user = await prisma.user.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase().trim(),
      phone,
      password: passwordHash,
      role: userRole, // <-- Usamos el rol determinado
    },
  });
  const { password: _, ...userWithoutPassword } = user;
  res.status(201).json(userWithoutPassword);
});

app.get("/patients/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: "Not found" });
  res.json(user);
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
      // Guardamos el token en el usuario (sea paciente o cuidador)
      data: { pushToken: token }, 
    });
    console.log(`[Push Token] Token guardado para usuario ${updatedUser.firstName}: ${token}`);
    res.json({ ok: true, message: "Token guardado." });
  } catch (error) {
    console.error("Error al guardar el push token:", error);
    res.status(500).json({ error: "No se pudo guardar el token." });
  }
});

// ================= Medicamentos =================
app.post(
  "/patients/:patientId/medications",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    
    // --- CAMBIO 1: Añadimos 'type' a la desestructuración ---
    const { name, dosage, quantity, presentation, instructions, color, type } =
      req.body as {
        name?: string;
        dosage?: string;
        quantity?: number;
        presentation?: string;
        instructions?: string;
        color?: string;
        type?: MedicationType; // <-- Aceptamos el nuevo tipo
      };
      
    if (!name) return res.status(400).json({ error: "Name is required" });

    // --- CAMBIO 2 (Opcional pero recomendado): Validación ---
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
          type: type || MedicationType.PILL, // <-- CAMBIO 3: Guardamos el tipo (o 'PILL' por defecto)
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

// ================= Horarios =================
app.post("/schedules", async (req: Request, res: Response) => {
  // --- CAMBIO 1: Añadir 'alertType' ---
  const {
    medicationId,
    time,
    frequencyType,
    frequencyValue,
    daysOfWeek,
    endDate,
    alertType, // <-- Nuevo campo
  } = req.body as {
    medicationId?: string;
    time?: string;
    frequencyType?: string;
    frequencyValue?: number;
    daysOfWeek?: string;
    endDate?: string;
    alertType?: AlertType; // <-- Nuevo tipo
  };

  if (!medicationId || !time || !frequencyType)
    return res.status(400).json({ error: "Missing fields" });

  // Validación opcional pero recomendada
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
        // --- CAMBIO 2: Guardar el campo (o 'NOTIFICATION' por defecto) ---
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

// ================= Tomas (IntakeLog) =================
app.post("/intakes", async (req: Request, res: Response) => {
  const { medicationId, scheduleId, scheduledFor, action, actionAt, note } =
    req.body as {
      medicationId?: string;
      scheduleId?: string;
      scheduledFor?: string;
      action?: string; // "CONFIRMED", "POSTPONED"
      actionAt?: string;
      note?: string;
    };

  if (!medicationId || !scheduledFor || !action || !actionAt)
    return res.status(400).json({ error: "Missing fields" });

  try {
    const scheduledForDate = new Date(scheduledFor);

    // Usamos 'upsert' (Actualizar o Insertar)
    const intake = await prisma.intakeLog.upsert({
      where: {
        // Busca el registro PENDING que coincide
        medicationId_scheduledFor: {
          medicationId: medicationId,
          scheduledFor: scheduledForDate,
        }
      },
      // --- ACTUALIZA el registro PENDING ---
      update: {
        action: action,
        actionAt: new Date(actionAt),
        note: note,
      },
      // --- CREA (si no existía PENDING, ej: toma manual) ---
      create: {
        medicationId: medicationId,
        scheduleId: scheduleId,
        scheduledFor: scheduledForDate,
        action: action,
        actionAt: new Date(actionAt),
        note: note,
      }
    });
    res.status(201).json(intake);
  } catch (e: any) {
    console.error("Error en POST /intakes (upsert):", e.message);
    res.status(400).json({ error: (e as Error).message });
  }
});

// Listar tomas de paciente por rango de fechas (incluye info de medicamento)
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
    return res.status(400).json({ error: "Faltan campos (medicationId, scheduleId, scheduledFor)" });
  }

  try {
    const scheduledForDate = new Date(scheduledFor);

    // Usamos 'upsert' para crear el log PENDING
    // Si ya existe (porque la app se cerró y volvió a abrir), no hace nada.
    const intake = await prisma.intakeLog.upsert({
      where: {
        // Busca usando el constraint @unique que acabamos de añadir
        medicationId_scheduledFor: {
          medicationId: medicationId,
          scheduledFor: scheduledForDate,
        }
      },
      // Si ya existe, no actualiza nada
      update: {}, 
      // Si no existe, lo crea como PENDING
      create: {
        medicationId: medicationId,
        scheduleId: scheduleId,
        scheduledFor: scheduledForDate,
        action: "PENDING",
        // actionAt queda nulo (null)
      }
    });

    res.status(201).json(intake);
  } catch (e: any) {
    console.error("Error al crear intake 'PENDING':", e.message);
    res.status(500).json({ error: (e as Error).message });
  }
});

// ================= Lógica next-dose (opcional, respeta tus campos) =================
function getNextTriggerDate(schedule: Schedule): Date | null {
  const [hour, minute] = schedule.time.split(':').map(Number); // Estos ya son UTC
  const now = new Date(); // Fecha/hora actual en UTC (comportamiento por defecto en servidores)

  // Creamos la fecha candidata usando funciones UTC para evitar cualquier ambigüedad
  const nextDate = new Date(now);
  nextDate.setUTCHours(hour, minute, 0, 0);

  switch (schedule.frequencyType) {
    case 'DAILY': {
      // Si la hora ya pasó hoy en UTC, la programamos para mañana en UTC
      if (nextDate <= now) {
        nextDate.setUTCDate(nextDate.getUTCDate() + 1);
      }
      return nextDate;
    }
    case 'HOURLY': {
      if (!schedule.frequencyValue) return null;
      // Ajustamos la primera hora de inicio a UTC
      let candidate = new Date();
      candidate.setUTCHours(hour, minute, 0, 0);
      
      // Si la hora de inicio ya pasó, calculamos la siguiente ocurrencia sumando horas
      while (candidate <= now) {
        candidate.setUTCHours(candidate.getUTCHours() + schedule.frequencyValue);
      }
      return candidate;
    }
    case 'WEEKLY': {
      const days = (schedule.daysOfWeek || '').split(',').map(Number).filter(n => !isNaN(n));
      if (days.length === 0) return null;
      
      // Buscamos en los próximos 7 días
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setUTCDate(now.getUTCDate() + i);
        const dow = checkDate.getUTCDay(); // Usamos el día de la semana en UTC

        if (days.includes(dow)) {
          const candidate = new Date(checkDate);
          candidate.setUTCHours(hour, minute, 0, 0);
          if (candidate > now) {
            return candidate;
          }
        }
      }
      return null; // No se encontró en los próximos 7 días
    }
    default:
      return null;
  }
}

interface NextDoseResponse {
  medication: Medication;
  schedule: Schedule;
  triggerDate: Date;
  isPostponed?: boolean;
}

app.get(
  "/patients/:patientId/next-dose",
  async (req: Request, res: Response) => {
    const { patientId } = req.params;
    const now = new Date();

    try {
      const meds = await prisma.medication.findMany({
        where: { patientId, active: true, deletedAt: null },
        include: { schedules: { where: { active: true } } },
      });

      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      const todaysLogs = await prisma.intakeLog.findMany({
        where: {
          medication: { patientId },
          actionAt: { gte: start, lte: end },
        },
      });

      const upcoming: NextDoseResponse[] = [];
      for (const med of meds) {
        for (const s of med.schedules) {
          const trigger = getNextTriggerDate(s);
          if (!trigger) continue;

          const logMatch = todaysLogs.find(
            (l) =>
              l.medicationId === med.id &&
              new Date(l.scheduledFor).getHours() === trigger.getHours() &&
              new Date(l.scheduledFor).getMinutes() === trigger.getMinutes()
          );

          if (logMatch && logMatch.action === "POSTPONED" && logMatch.actionAt) {
            const postponed = new Date(
              new Date(logMatch.actionAt).getTime() + 10 * 60000
            );
            if (postponed > now) {
              upcoming.push({
                medication: med,
                schedule: s,
                triggerDate: postponed,
                isPostponed: true,
              });
            }
          } else if (!logMatch) {
            upcoming.push({
              medication: med,
              schedule: s,
              triggerDate: trigger,
            });
          }
        }
      }

      if (!upcoming.length) return res.json(null);
      upcoming.sort(
        (a, b) => a.triggerDate.getTime() - b.triggerDate.getTime()
      );
      console.log(" backend | Enviando next-dose:", upcoming[0].triggerDate);

      res.json(upcoming[0]);
    } catch (e) {
      console.error("Error next-dose:", e);
      res.status(500).json({ error: "No se pudo calcular la próxima dosis." });
    }
  }
);

// ================= Cuidadores =================
// Validaciones Zod
const caregiverCreateSchema = z.object({
  firstName: z.string().min(1, "firstName requerido"),
  lastName: z.string().min(1, "lastName requerido"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(), // opcional para no romper front
});

const caregiverLinkSchema = z.object({
  patientId: z.string().min(1, "patientId requerido"),
  relation: z.string().optional(), // "hijo", "esposo(a)", etc.
});

// Crear cuidador (User con role = CAREGIVER)
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

// Obtener cuidador por id
app.get("/caregivers/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  const cg = await prisma.user.findFirst({ where: { id, role: "CAREGIVER" } });
  if (!cg) return res.status(404).json({ error: "Caregiver not found" });
  const { password: _pw, ...safe } = cg;
  res.json(safe);
});

// Vincular paciente a cuidador
app.post(
  "/caregivers/:caregiverId/patients",
  async (req: Request, res: Response) => {
    const { caregiverId } = req.params;
    const parsed = caregiverLinkSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: parsed.error.flatten() });
    const { patientId, relation } = parsed.data;

    // Validar roles/exists
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
      // 1. Chequeo de seguridad: Validar que el cuidador está vinculado al paciente
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
          .json({ error: "Acceso denegado: No tienes permiso para ver a este paciente." });
      }

      // 2. Obtener los datos del paciente y sus medicamentos/horarios activos
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
            orderBy: { name: 'asc' },
          },
        },
      });

      if (!patientData) {
        return res.status(404).json({ error: "Paciente no encontrado." });
      }

      // 3. Obtener las tomas (intakes) registradas en el día de hoy
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
        orderBy: { actionAt: 'desc' },
      });

      // 4. Combinar y enviar la respuesta
      const { password, ...safePatientData } = patientData; // Nunca enviar la contraseña

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

// Listar pacientes de un cuidador
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

// Listar cuidadores de un paciente
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

// Desvincular (opcional, por completitud)
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

// ================= Sincronización (mantengo tu lógica, sin tocar campos del front) =================
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
            role: "PATIENT", // por defecto
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

// ================= Chatbot =================
// Actualiza el import para traer las nuevas funciones
import {
  classifyIntent,
  extractMedicationDetails,
  getConversationalResponse,
} from "./services/chatbotService";

app.post("/chatbot/interpret", async (req: Request, res: Response) => {
  const { message, patientId } = req.body as { message?: string; patientId?: string };

  if (!message || !patientId) {
    return res.status(400).json({ error: "message y patientId son requeridos." });
  }

  try {
    const intent = await classifyIntent(message);
    console.log("🤖 Intención clasificada por la IA:", intent);

    switch (intent) {
      // (El case de ADD_MEDICATION sigue igual)
      case 'ADD_MEDICATION':
        const details = await extractMedicationDetails(message);
        console.log("💊 Detalles extraídos por la IA:", details);

        if (!details || !details.medication?.name || !details.schedules?.[0]?.time) {
          return res.json({ response: "Entiendo que quieres agregar un medicamento, pero no capté todos los detalles." });
        }

        const { medication: medData, schedules: schedulesData } = details;
        const newMedication = await prisma.medication.create({
          data: { patientId, name: medData.name, dosage: medData.dosage, quantity: 0 },
        });

        for (const schedule of schedulesData) {
          const [hour, minute] = schedule.time.split(':').map(Number);
          const dateInUTC = new Date();
          dateInUTC.setUTCHours(hour + 3, minute, 0, 0); // Asumiendo UTC-3
          const timeInUTC = `${dateInUTC.getUTCHours().toString().padStart(2, '0')}:${dateInUTC.getUTCMinutes().toString().padStart(2, '0')}`;
          await prisma.schedule.create({
            data: { medicationId: newMedication.id, time: timeInUTC, frequencyType: schedule.frequencyType },
          });
        }
        return res.json({ response: `¡Listo! He registrado **${newMedication.name} ${newMedication.dosage || ''}**.` });

      // --- ¡NUEVA LÓGICA AQUÍ! ---
      case 'CONFIRM_INTAKE': {
        // 1. Obtenemos todos los medicamentos y sus horarios activos
        const meds = await prisma.medication.findMany({
            where: { patientId, active: true, deletedAt: null },
            include: { schedules: { where: { active: true } } },
        });

        if (!meds.length) {
            return res.json({ response: "No tienes medicamentos programados." });
        }

        // 2. Buscamos en el historial las tomas YA REGISTRADAS hoy
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        const todaysLogs = await prisma.intakeLog.findMany({
            where: {
                medication: { patientId },
                actionAt: { gte: startOfDay, lte: endOfDay },
                // Excluimos las pospuestas para que puedan ser tomadas
                NOT: { action: 'POSTPONED' } 
            },
        });
        
        // 3. Calculamos todas las próximas dosis posibles
        const upcomingDoses: NextDoseResponse[] = [];
        for (const med of meds) {
            for (const s of med.schedules) {
                const triggerDate = getNextTriggerDate(s);
                if (!triggerDate) continue;

                // 4. VERIFICACIÓN CLAVE: ¿Ya existe un registro para esta dosis hoy?
                const logMatch = todaysLogs.find(
                    (log) => log.medicationId === med.id && 
                             new Date(log.scheduledFor).getUTCHours() === triggerDate.getUTCHours() &&
                             new Date(log.scheduledFor).getUTCMinutes() === triggerDate.getUTCMinutes()
                );

                // Si NO hay un registro coincidente, entonces es una dosis pendiente
                if (!logMatch) {
                    upcomingDoses.push({ medication: med, schedule: s, triggerDate });
                }
            }
        }

        if (!upcomingDoses.length) {
            return res.json({ response: "¡Excelente! Parece que ya estás al día con todas tus dosis de hoy." });
        }

        // 5. Ordenamos para encontrar la dosis pendiente más cercana
        upcomingDoses.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
        
        const nextDoseToLog = upcomingDoses[0];
        const { medication: medicationToLog, schedule: scheduleToLog, triggerDate: scheduledFor } = nextDoseToLog;

        // 6. Creamos el registro en el historial para el medicamento correcto
        await prisma.intakeLog.create({
          data: {
            medicationId: medicationToLog.id,
            scheduleId: scheduleToLog.id,
            action: "CONFIRMED",
            actionAt: new Date(),
            scheduledFor: scheduledFor,
          },
        });

        return res.json({ response: `¡Excelente! He registrado la toma de **${medicationToLog.name}**.` });
      }

      case 'GREETING':
        const conversationalResponse = await getConversationalResponse(message);
        return res.json({ response: conversationalResponse });

      case 'UNKNOWN':
      default:
        return res.json({
          response: "No estoy seguro de haber entendido. Puedo registrar un medicamento o confirmar una toma."
        });
    }
  } catch (error) {
    console.error("Error en el endpoint del chatbot:", error);
    res.status(500).json({ error: "Ocurrió un error al procesar tu solicitud." });
  }
});

// ================= CRON JOB =================
// Esta ruta será llamada por Render cada 10 minutos
app.post("/cron/mark-skipped", async (req: Request, res: Response) => {
  console.log("[Cron Job] Ejecutando tarea para marcar tomas omitidas...");
  
  try {
    // 1. Calcula el tiempo límite (hace 10 minutos en UTC)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);

    // 2. Busca todas las tomas que sigan "PENDING" y sean más antiguas que el límite
    const intakesToSkip = await prisma.intakeLog.findMany({
      where: {
        action: "PENDING",
        scheduledFor: {
          lt: tenMinutesAgo, // lt = "less than" (menor que)
        },
      },
    });

    if (intakesToSkip.length === 0) {
      console.log("[Cron Job] No se encontraron tomas para omitir.");
      return res.status(200).json({ message: "No intakes to skip." });
    }

    // 3. Actualiza todas las tomas encontradas a "SKIPPED"
    const skippedCount = await prisma.intakeLog.updateMany({
      where: {
        id: {
          in: intakesToSkip.map(intake => intake.id), // Actualiza por ID
        },
      },
      data: {
        action: "SKIPPED",
        actionAt: new Date(), // Marcamos la hora en que el sistema la omitió
      },
    });

    console.log(`[Cron Job] ${skippedCount.count} tomas marcadas como SKIPPED.`);
    res.status(200).json({ message: `Skipped ${skippedCount.count} intakes.` });

  } catch (error) {
    console.error("[Cron Job] Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ================= Server =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});

