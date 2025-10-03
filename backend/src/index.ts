import express, { Request, Response } from 'express';
import cors from 'cors';
import { PrismaClient, Medication, Schedule, IntakeLog } from '@prisma/client';
import bcrypt from 'bcrypt';

const app = express();
app.use(cors());
const prisma = new PrismaClient();

app.use(express.json());

// --- LÓGICA DE CÁLCULO (TRADUCIDA DE TU MEDICATIONLOGIC.TS) ---

// --- 2. ENDPOINT DE LOGIN MODIFICADO ---
app.post('/login', async (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() }
    });
    
    // Si no encontramos al usuario O la contraseña no coincide, damos el mismo error genérico
    if (!user || !user.password) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(404).json({ error: 'Invalid credentials' });
    }

    // No devolvemos el hash de la contraseña al cliente por seguridad
    const { password: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);

  } catch (error) {
    res.status(500).json({ error: 'An unexpected error occurred.' });
  }
});

/**
 * Calcula la fecha y hora de la próxima toma para una regla de horario individual.
 */
function getNextTriggerDate(schedule: Schedule): Date | null {
  const [hour, minute] = schedule.time.split(':').map(Number);
  const now = new Date(); // Usamos la hora del servidor

  switch (schedule.frequencyType) {
    case 'DAILY': {
      const nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) {
        nextDate.setDate(now.getDate() + 1);
      }
      return nextDate;
    }
    case 'HOURLY': {
      if (!schedule.frequencyValue) return null;
      let nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) {
        while (nextDate <= now) {
          nextDate.setHours(nextDate.getHours() + schedule.frequencyValue);
        }
      }
      return nextDate;
    }
    case 'WEEKLY': {
      const days = schedule.daysOfWeek?.split(',').map(Number) || [];
      if (days.length === 0) return null;
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay();
        
        if (days.includes(dayOfWeek)) {
          const potentialNextDate = new Date(checkDate);
          potentialNextDate.setHours(hour, minute, 0, 0);
          if (potentialNextDate > now) {
            return potentialNextDate;
          }
        }
      }
      return null;
    }
  }
  return null;
}

// Interfaz para el objeto que devolveremos
interface NextDoseResponse {
  medication: Medication;
  schedule: Schedule;
  triggerDate: Date;
  isPostponed?: boolean;
}

// --- NUEVO ENDPOINT PARA LA PRÓXIMA DOSIS ---
app.get('/patients/:patientId/next-dose', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const now = new Date();

  try {
    // 1. Obtenemos todos los medicamentos y sus horarios asociados para el paciente
    const medicationsWithSchedules = await prisma.medication.findMany({
      where: { patientId, active: true, deletedAt: null },
      include: { schedules: { where: { active: true } } },
    });

    // 2. Obtenemos todos los registros de tomas de hoy
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    
    const todaysLogs = await prisma.intakeLog.findMany({
        where: {
            medication: { patientId },
            actionAt: { gte: startOfToday, lte: endOfToday }
        }
    });

    // 3. Calculamos todas las posibles dosis futuras
    const upcomingDoses: NextDoseResponse[] = [];
    for (const med of medicationsWithSchedules) {
      for (const schedule of med.schedules) {
        const triggerDate = getNextTriggerDate(schedule);
        if (triggerDate) {
          const logForThisDose = todaysLogs.find(log => 
            log.medicationId === med.id &&
            new Date(log.scheduledFor).getHours() === triggerDate.getHours() &&
            new Date(log.scheduledFor).getMinutes() === triggerDate.getMinutes()
          );

          if (logForThisDose) {
            if (logForThisDose.action === 'POSTPONED') {
              const postponedTime = new Date(new Date(logForThisDose.actionAt).getTime() + 10 * 60000); // Asumimos 10 min de posposición
              if (postponedTime > now) {
                upcomingDoses.push({
                  medication: med,
                  schedule: schedule,
                  triggerDate: postponedTime,
                  isPostponed: true,
                });
              }
            }
          } else {
            upcomingDoses.push({
              medication: med,
              schedule: schedule,
              triggerDate: triggerDate,
            });
          }
        }
      }
    }

    // 4. Si no hay ninguna dosis, respondemos que no hay nada
    if (upcomingDoses.length === 0) {
      return res.json(null);
    }

    // 5. Ordenamos las dosis y devolvemos la más cercana
    upcomingDoses.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
    res.json(upcomingDoses[0]);

  } catch (error) {
    console.error("Error calculando la próxima dosis:", error);
    res.status(500).json({ error: "No se pudo calcular la próxima dosis." });
  }
});

// --- RUTAS ORIGINALES (AHORA CON TIPOS) ---

// Health check
// 2. Añadimos los tipos a req y res
app.get('/health', (req: Request, res: Response) => {
  res.json({ ok: true });
});

// Crear paciente
app.post('/patients', async (req: Request, res: Response) => {
  const { firstName, lastName, email, phone, password } = req.body;
  if (!firstName || !lastName || !email || !password) {
    return res.status(400).json({ error: 'Required fields are missing' });
  }
  try {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const user = await prisma.user.create({
      data: { 
        firstName, 
        lastName, 
        email: email.toLowerCase().trim(), 
        phone, 
        password: passwordHash, // Guardamos el hash, no la contraseña original
        role: 'PATIENT' 
      }
    });

    const { password: _, ...userWithoutPassword } = user;
    res.status(201).json(userWithoutPassword);

  } catch (err) {
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
// --- RUTA CORREGIDA ---
app.get('/patients/:patientId/intakes', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { from, to } = req.query as { from: string, to: string };
  try {
    const user = await prisma.user.findUnique({ where: { id: patientId } });
    if (!user) return res.status(404).json({ error: 'Patient not found' });

    const intakes = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId: patientId },
        scheduledFor: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined,
        },
      },
      include: {
        medication: true, // Esta es la parte clave que faltaba en la versión anterior
      },
      orderBy: {
        actionAt: 'desc',
      },
    });
    res.json(intakes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

// --- ÚNICO CAMBIO EN ESTE ARCHIVO ---
// Listar tomas de paciente por rango de fechas
app.get('/patients/:patientId/intakes', async (req: Request, res: Response) => {
  const { patientId } = req.params;
  const { from, to } = req.query as { from: string, to: string };
  
  try {
    const user = await prisma.user.findUnique({ where: { id: patientId } });
    if (!user) return res.status(404).json({ error: 'Patient not found' });

    const intakes = await prisma.intakeLog.findMany({
      where: {
        medication: { patientId: patientId }, // Simplificamos la consulta
        scheduledFor: {
          gte: from ? new Date(from) : undefined,
          lte: to ? new Date(to) : undefined
        }
      },
      // Con 'include', le decimos a Prisma que también traiga la información del medicamento asociado.
      include: {
        medication: true 
      },
      orderBy: {
        actionAt: 'desc' // Ordenamos por fecha de la acción descendente
      }
    });
    res.json(intakes);
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
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