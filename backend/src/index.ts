// 1. Importamos los tipos 'Request' y 'Response' desde Express
import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';

const app = express();
app.use(cors());
const prisma = new PrismaClient();

app.use(express.json());

// --- RUTAS ORIGINALES (AHORA CON TIPOS) ---

// Health check
// 2. Añadimos los tipos a req y res
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Crear paciente
app.post('/patients', async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone } = req.body;
  if (!firstName || !lastName) return res.status(400).json({ error: 'First name and last name are required' });
  try {
    const user = await prisma.user.create({
      data: { firstName, lastName, email, phone, role: 'PATIENT' }
    });
    res.status(201).json(user);
  } catch (err) {
    // 3. Manejamos el error 'unknown' de forma segura
    res.status(400).json({ error: (err as Error).message });
  }
});

// Obtener paciente por id
app.get('/patients/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// Crear medicamento
app.post('/patients/:patientId/medications', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { name, dosage, quantity, presentation, instructions, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const med = await prisma.medication.create({
      data: {
        patientId,
        name,
        dosage,
        quantity,
        presentation,
        instructions,
        color
      }
    });
    res.status(201).json(med);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Listar medicamentos de paciente
app.get('/patients/:patientId/medications', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const meds = await prisma.medication.findMany({
    where: { patientId, active: true, deletedAt: null }
  });
  res.json(meds);
});

// Soft delete medicamento
app.delete('/medications/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const med = await prisma.medication.update({
      where: { id },
      data: { active: false, deletedAt: new Date() }
    });
    res.json({ ok: true, medication: med });
  } catch (err) {
    res.status(404).json({ error: 'Not found' });
  }
});

// Crear horario
app.post('/schedules', async (req: Request, res: Response) => {
  const { medicationId, time, frequencyType, frequencyValue, daysOfWeek, endDate } = req.body;
  if (!medicationId || !time || !frequencyType) return res.status(400).json({ error: 'Missing fields' });
  try {
    const schedule = await prisma.schedule.create({
      data: {
        medicationId,
        time,
        frequencyType,
        frequencyValue,
        daysOfWeek,
        endDate
      }
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Listar horarios de medicamento
app.get('/medications/:medId/schedules', async (req: Request, res: Response) => {
  const { medId } = req.params;
  const schedules = await prisma.schedule.findMany({
    where: { medicationId: medId, active: true }
  });
  res.json(schedules);
});

// Registrar toma
app.post('/intakes', async (req: Request, res: Response) => {
  const { medicationId, scheduleId, scheduledFor, action, actionAt, note } = req.body;
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
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// Listar tomas de paciente por rango de fechas
app.get('/patients/:patientId/intakes', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { from, to } = req.query as { from: string, to: string };
  const user = await prisma.user.findUnique({ where: { id: patientId } });
  if (!user) return res.status(404).json({ error: 'Patient not found' });
  const meds = await prisma.medication.findMany({ where: { patientId } });
  const medIds = meds.map((m: { id: string }) => m.id);
  const intakes = await prisma.intakeLog.findMany({
    where: {
      medicationId: { in: medIds },
      scheduledFor: {
        gte: from ? new Date(from) : undefined,
        lte: to ? new Date(to) : undefined
      }
    }
  });
  res.json(intakes);
});


// --- NUEVO CÓDIGO DE SINCRONIZACIÓN (CON TIPOS) ---

app.post('/sync/full', async (req: Request, res: Response) => {
  const { users, medications, schedules, intakeLogs } = req.body;

  if (!users || !medications || !schedules || !intakeLogs) {
    return res.status(400).json({ error: 'Faltan datos en el payload de sincronización.' });
  }
  console.log('Iniciando proceso de sincronización completa...');
  try {
    await prisma.$transaction(async (tx: any) => {
      console.log('Borrando datos antiguos del backend...');
      await tx.intakeLog.deleteMany({});
      await tx.schedule.deleteMany({});
      await tx.medication.deleteMany({});
      await tx.user.deleteMany({});

      const userMap = new Map<number, string>();
      const medicationMap = new Map<number, string>();

      console.log(`Sincronizando ${users.length} usuarios...`);
      for (const user of users) {
        const newUser = await tx.user.create({
          data: {
            firstName: user.nombre,
            lastName: user.apellido,
            email: user.email,
            phone: user.telefono,
            birthDate: user.fechaNacimiento,
            address: user.direccion,
            emergencyContact: user.contactoEmergencia,
            emergencyPhone: user.telefonoEmergencia,
            medicalConditions: user.condicionesMedicas,
            allergies: user.alergias,
          },
        });
        userMap.set(user.id, newUser.id);
      }

      console.log(`Sincronizando ${medications.length} medicamentos...`);
      for (const med of medications) {
        const newPatientId = userMap.get(med.userId);
        if (!newPatientId) continue;
        const newMed = await tx.medication.create({
          data: {
            patientId: newPatientId,
            name: med.name,
            dosage: med.dosage,
            quantity: med.quantity,
            instructions: med.instructions,
          },
        });
        medicationMap.set(med.id, newMed.id);
      }

      console.log(`Sincronizando ${schedules.length} horarios...`);
      for (const schedule of schedules) {
        const newMedId = medicationMap.get(schedule.medicationId);
        if (!newMedId) continue;
        await tx.schedule.create({
          data: {
            medicationId: newMedId,
            time: schedule.time,
            frequencyType: schedule.frequencyType,
            frequencyValue: schedule.frequencyValue,
            daysOfWeek: schedule.daysOfWeek,
            endDate: schedule.endDate,
          },
        });
      }
      
      console.log(`Sincronizando ${intakeLogs.length} registros de tomas...`);
      for (const log of intakeLogs) {
        const newMedId = medicationMap.get(log.medicationId);
        if (!newMedId) continue;
        await tx.intakeLog.create({
          data: {
            medicationId: newMedId,
            scheduledFor: new Date(log.scheduledFor),
            action: log.action,
            actionAt: new Date(log.actionAt),
          },
        });
      }
    });
    res.status(200).json({ message: 'Sincronización completada exitosamente.' });
    console.log('Sincronización finalizada.');
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    res.status(500).json({ error: 'Ocurrió un error durante la sincronización.' });
  }
});


// --- INICIO DEL SERVIDOR ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});