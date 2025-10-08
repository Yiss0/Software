import express, { Request, Response } from 'express';
import cors from 'cors';
import 'dotenv/config';
import { PrismaClient, Medication, Schedule } from '@prisma/client';
import bcrypt from 'bcrypt';
import { z } from 'zod';

const app = express();
app.use(cors());
app.use(express.json());

const prisma = new PrismaClient();

// ================= Health =================
app.get('/health', (_req: Request, res: Response) => {
  res.json({ ok: true });
});

// ================= Auth/Login =================
app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body as { email?: string; password?: string };
  if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    if (!user || !user.password) return res.status(404).json({ error: 'Invalid credentials' });

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(404).json({ error: 'Invalid credentials' });

    const { password: _pw, ...safeUser } = user;
    res.json(safeUser);
  } catch {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

// ================= Pacientes =================
app.post('/patients', async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password } = req.body as {
    firstName?: string; lastName?: string; email?: string; phone?: string; password?: string;
  };
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase().trim(),
        phone,
        password: passwordHash,
        role: 'PATIENT'
      }
    });
    const { password: _pw, ...safeUser } = user;
    res.status(201).json(safeUser);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/patients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// ================= Medicamentos =================
app.post('/patients/:patientId/medications', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { name, dosage, quantity, presentation, instructions, color } = req.body as {
    name?: string; dosage?: string; quantity?: number; presentation?: string; instructions?: string; color?: string;
  };
  if (!name) return res.status(400).json({ error: 'Name is required' });

  try {
    const med = await prisma.medication.create({
      data: { patientId, name, dosage, quantity, presentation, instructions, color }
    });
    res.status(201).json(med);
  } catch (e: any) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/patients/:patientId/medications', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const meds = await prisma.medication.findMany({
    where: { patientId, active: true, deletedAt: null }
  });
  res.json(meds);
});

app.delete('/medications/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const med = await prisma.medication.update({
      where: { id },
      data: { active: false, deletedAt: new Date() }
    });
    res.json({ ok: true, medication: med });
  } catch {
    res.status(404).json({ error: 'Not found' });
  }
});

// ================= Horarios =================
app.post('/schedules', async (req: Request, res: Response) => {
  const { medicationId, time, frequencyType, frequencyValue, daysOfWeek, endDate } = req.body as {
    medicationId?: string; time?: string; frequencyType?: string; frequencyValue?: number;
    daysOfWeek?: string; endDate?: string;
  };
  if (!medicationId || !time || !frequencyType) return res.status(400).json({ error: 'Missing fields' });

  try {
    const schedule = await prisma.schedule.create({
      data: { medicationId, time, frequencyType, frequencyValue, daysOfWeek, endDate }
    });
    res.status(201).json(schedule);
  } catch (e: any) {
    res.status(400).json({ error: (e as Error).message });
  }
});

app.get('/medications/:medId/schedules', async (req: Request, res: Response) => {
  const { medId } = req.params;
  const schedules = await prisma.schedule.findMany({ where: { medicationId: medId, active: true } });
  res.json(schedules);
});

// ================= Tomas (IntakeLog) =================
app.post('/intakes', async (req: Request, res: Response) => {
  const { medicationId, scheduleId, scheduledFor, action, actionAt, note } = req.body as {
    medicationId?: string; scheduleId?: string; scheduledFor?: string; action?: string; actionAt?: string; note?: string;
  };
  if (!medicationId || !scheduledFor || !action || !actionAt) return res.status(400).json({ error: 'Missing fields' });

  try {
    const intake = await prisma.intakeLog.create({
      data: {
        medicationId,
        scheduleId,
        scheduledFor: new Date(scheduledFor),
        action,
        actionAt: new Date(actionAt),
        note
      }
    });
    res.status(201).json(intake);
  } catch (e: any) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// Listar tomas de paciente por rango de fechas (incluye info de medicamento)
app.get('/patients/:patientId/intakes', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { from, to } = req.query as { from?: string; to?: string };

  try {
    const user = await prisma.user.findUnique({ where: { id: patientId } });
    if (!user) return res.status(404).json({ error: 'Patient not found' });

    const intakes = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId },
        scheduledFor: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      include: { medication: true },
      orderBy: { actionAt: 'desc' }
    });
    res.json(intakes);
  } catch (e: any) {
    res.status(500).json({ error: (e as Error).message });
  }
});

// ================= Lógica next-dose (opcional, respeta tus campos) =================
function getNextTriggerDate(schedule: Schedule): Date | null {
  const [hour, minute] = schedule.time.split(':').map(Number);
  const now = new Date();

  switch (schedule.frequencyType) {
    case 'DAILY': {
      const nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) nextDate.setDate(now.getDate() + 1);
      return nextDate;
    }
    case 'HOURLY': {
      if (!schedule.frequencyValue) return null;
      let nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) {
        while (nextDate <= now) nextDate.setHours(nextDate.getHours() + schedule.frequencyValue);
      }
      return nextDate;
    }
    case 'WEEKLY': {
      const days = (schedule.daysOfWeek || '').split(',').map(Number).filter((n) => !Number.isNaN(n));
      if (days.length === 0) return null;
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dow = checkDate.getDay();
        if (days.includes(dow)) {
          const candidate = new Date(checkDate);
          candidate.setHours(hour, minute, 0, 0);
          if (candidate > now) return candidate;
        }
      }
      return null;
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

app.get('/patients/:patientId/next-dose', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const now = new Date();

  try {
    const meds = await prisma.medication.findMany({
      where: { patientId, active: true, deletedAt: null },
      include: { schedules: { where: { active: true } } },
    });

    const start = new Date(); start.setHours(0, 0, 0, 0);
    const end = new Date();   end.setHours(23, 59, 59, 999);

    const todaysLogs = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId },
        actionAt: { gte: start, lte: end }
      }
    });

    const upcoming: NextDoseResponse[] = [];
    for (const med of meds) {
      for (const s of med.schedules) {
        const trigger = getNextTriggerDate(s);
        if (!trigger) continue;

        const logMatch = todaysLogs.find(l =>
          l.medicationId === med.id &&
          new Date(l.scheduledFor).getHours() === trigger.getHours() &&
          new Date(l.scheduledFor).getMinutes() === trigger.getMinutes()
        );

        if (logMatch && logMatch.action === 'POSTPONED') {
          const postponed = new Date(new Date(logMatch.actionAt).getTime() + 10 * 60000);
          if (postponed > now) {
            upcoming.push({ medication: med, schedule: s, triggerDate: postponed, isPostponed: true });
          }
        } else if (!logMatch) {
          upcoming.push({ medication: med, schedule: s, triggerDate: trigger });
        }
      }
    }

    if (!upcoming.length) return res.json(null);
    upcoming.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
    res.json(upcoming[0]);
  } catch (e) {
    console.error('Error next-dose:', e);
    res.status(500).json({ error: 'No se pudo calcular la próxima dosis.' });
  }
});

// ================= Cuidadores =================
// Validaciones Zod
const caregiverCreateSchema = z.object({
  firstName: z.string().min(1, 'firstName requerido'),
  lastName: z.string().min(1, 'lastName requerido'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  password: z.string().min(6).optional(), // opcional para no romper front
});

const caregiverLinkSchema = z.object({
  patientId: z.string().min(1, 'patientId requerido'),
  relation: z.string().optional(), // "hijo", "esposo(a)", etc.
});

// Crear cuidador (User con role = CAREGIVER)
app.post('/caregivers', async (req: Request, res: Response) => {
  const parsed = caregiverCreateSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

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
        role: 'CAREGIVER'
      }
    });
    const { password: _pw, ...safe } = caregiver;
    res.status(201).json(safe);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Obtener cuidador por id
app.get('/caregivers/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const cg = await prisma.user.findFirst({ where: { id, role: 'CAREGIVER' } });
  if (!cg) return res.status(404).json({ error: 'Caregiver not found' });
  const { password: _pw, ...safe } = cg;
  res.json(safe);
});

// Vincular paciente a cuidador
app.post('/caregivers/:caregiverId/patients', async (req: Request, res: Response) => {
  const { caregiverId } = req.params;
  const parsed = caregiverLinkSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { patientId, relation } = parsed.data;

  // Validar roles/exists
  const caregiver = await prisma.user.findFirst({ where: { id: caregiverId, role: 'CAREGIVER' } });
  if (!caregiver) return res.status(404).json({ error: 'Caregiver not found' });

  const patient = await prisma.user.findFirst({ where: { id: patientId, role: 'PATIENT' } });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  try {
    const link = await prisma.patientCaregiver.create({
      data: { caregiverId, patientId, relation },
    });
    res.status(201).json(link);
  } catch (e: any) {
    if (e?.code === 'P2002') return res.status(409).json({ error: 'Link already exists' });
    res.status(500).json({ error: 'Internal error' });
  }
});

// Listar pacientes de un cuidador
app.get('/caregivers/:caregiverId/patients', async (req: Request, res: Response) => {
  const { caregiverId } = req.params;

  const caregiver = await prisma.user.findFirst({ where: { id: caregiverId, role: 'CAREGIVER' } });
  if (!caregiver) return res.status(404).json({ error: 'Caregiver not found' });

  const links = await prisma.patientCaregiver.findMany({
    where: { caregiverId },
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(links);
});

// Listar cuidadores de un paciente
app.get('/patients/:patientId/caregivers', async (req: Request, res: Response) => {
  const { patientId } = req.params;

  const patient = await prisma.user.findFirst({ where: { id: patientId, role: 'PATIENT' } });
  if (!patient) return res.status(404).json({ error: 'Patient not found' });

  const links = await prisma.patientCaregiver.findMany({
    where: { patientId },
    include: { caregiver: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json(links);
});

// Desvincular (opcional, por completitud)
app.delete('/caregivers/:caregiverId/patients/:patientId', async (req: Request, res: Response) => {
  const { caregiverId, patientId } = req.params;
  try {
    await prisma.patientCaregiver.delete({
      where: { patientId_caregiverId: { patientId, caregiverId } }
    });
    res.json({ ok: true });
  } catch {
    res.status(404).json({ error: 'Link not found' });
  }
});

// ================= Sincronización (mantengo tu lógica, sin tocar campos del front) =================
app.post('/sync/full', async (req: Request, res: Response) => {
  const { users, medications, schedules, intakeLogs } = req.body as any;
  if (!users || !medications || !schedules || !intakeLogs) {
    return res.status(400).json({ error: 'Faltan datos en el payload de sincronización.' });
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
            lastName:  u.apellido,
            email:     u.email,
            phone:     u.telefono,
            birthDate: u.fechaNacimiento,
            address:   u.direccion,
            emergencyContact:  u.contactoEmergencia,
            emergencyPhone:    u.telefonoEmergencia,
            medicalConditions: u.condicionesMedicas,
            allergies:         u.alergias,
            role: 'PATIENT', // por defecto
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
            endDate: s.endDate
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
            note: l.note
          },
        });
      }
    });

    res.status(200).json({ message: 'Sincronización completada exitosamente.' });
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    res.status(500).json({ error: 'Ocurrió un error durante la sincronización.' });
  }
});

// ================= Server =================
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
