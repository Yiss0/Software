const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');

const app = express();
app.use(cors());
const prisma = new PrismaClient();

app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ ok: true });
});

// Crear paciente
app.post('/patients', async (req, res) => {
  const { name, email, phone } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const user = await prisma.user.create({
      data: { name, email, phone, role: 'PATIENT' }
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Obtener paciente por id
app.get('/patients/:id', async (req, res) => {
  const { id } = req.params;
  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(user);
});

// Crear medicamento
app.post('/patients/:patientId/medications', async (req, res) => {
  const { patientId } = req.params;
  const { name, dosage, presentation, instructions, color } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });
  try {
    const med = await prisma.medication.create({
      data: {
        patientId,
        name,
        dosage,
        presentation,
        instructions,
        color
      }
    });
    res.status(201).json(med);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar medicamentos de paciente
app.get('/patients/:patientId/medications', async (req, res) => {
  const { patientId } = req.params;
  const meds = await prisma.medication.findMany({
    where: { patientId, active: true, deletedAt: null }
  });
  res.json(meds);
});

// Soft delete medicamento
app.delete('/medications/:id', async (req, res) => {
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
app.post('/schedules', async (req, res) => {
  const { medicationId, timeLocal, daysCsv, repeatEveryMin, snoozeMin, maxSnoozeMin } = req.body;
  if (!medicationId || !timeLocal || !daysCsv) return res.status(400).json({ error: 'Missing fields' });
  try {
    const schedule = await prisma.schedule.create({
      data: {
        medicationId,
        timeLocal,
        daysCsv,
        repeatEveryMin,
        snoozeMin,
        maxSnoozeMin
      }
    });
    res.status(201).json(schedule);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar horarios de medicamento
app.get('/medications/:medId/schedules', async (req, res) => {
  const { medId } = req.params;
  const schedules = await prisma.schedule.findMany({
    where: { medicationId: medId, active: true }
  });
  res.json(schedules);
});

// Registrar toma
app.post('/intakes', async (req, res) => {
  const { medicationId, scheduleId, scheduledFor, action, actionAt, snoozes, note, deviceOffsetMin } = req.body;
  if (!medicationId || !scheduledFor || !action || !actionAt) return res.status(400).json({ error: 'Missing fields' });
  try {
    const intake = await prisma.intakeLog.create({
      data: {
        medicationId,
        scheduleId,
        scheduledFor: new Date(scheduledFor),
        action,
        actionAt: new Date(actionAt),
        snoozes,
        note,
        deviceOffsetMin
      }
    });
    res.status(201).json(intake);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Listar tomas de paciente por rango de fechas
app.get('/patients/:patientId/intakes', async (req, res) => {
  const { patientId } = req.params;
  const { from, to } = req.query;
  const user = await prisma.user.findUnique({ where: { id: patientId } });
  if (!user) return res.status(404).json({ error: 'Patient not found' });
  const meds = await prisma.medication.findMany({ where: { patientId } });
  const medIds = meds.map(m => m.id);
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API listening on port ${PORT}`);
});
