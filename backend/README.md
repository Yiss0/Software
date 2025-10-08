# 1) Instalar dependencias
npm install

# 2) Generar cliente Prisma y aplicar migraciones
npx prisma generate
npx prisma migrate dev --name init

# 3) Levantar en desarrollo
npm run dev
# → http://localhost:4000/health  => { "ok": true }

# (Opcional) Prisma Studio para inspeccionar la DB
npx prisma studio
🧩 Modelos (resumen)
User: id, name, email?, phone?, role ("PATIENT"/"CAREGIVER" como string), timestamps.

Medication: id, patientId, name, dosage?, flags (active, deletedAt), timestamps.

Schedule: id, medicationId, timeLocal (HH:mm), daysCsv, repeatEveryMin?, snoozeMin?, etc.

IntakeLog: id, medicationId, scheduleId?, scheduledFor, action ("CONFIRMED"|"SNOOZED"|"SKIPPED"), actionAt, snoozes.

Nota: En SQLite los enums se representan como string; la API valida los valores admitidos.

📡 Endpoints principales
Health

GET /health

Pacientes

POST /patients (crear)
Body: { "name": "Ana", "email": "ana@test.com" }

GET /patients/:id (obtener)

Medicamentos

POST /patients/:patientId/medications (crear)

GET /patients/:patientId/medications (listar activos)

DELETE /medications/:id (soft delete)

Horarios

POST /schedules (crear)

GET /medications/:medId/schedules (listar por medicamento)

Historial de tomas

POST /intakes (registrar acción)

GET /patients/:patientId/intakes?from&to (listar por rango)

🧪 Prueba rápida (cURL)
bash
Copiar código
# 1) Health
curl http://localhost:4000/health

# 2) Crear paciente
curl -X POST http://localhost:4000/patients \
  -H "Content-Type: application/json" \
  -d '{"name":"Ana","email":"ana@test.com"}'

# 3) Crear medicamento (usar el patientId devuelto)
curl -X POST http://localhost:4000/patients/<patientId>/medications \
  -H "Content-Type: application/json" \
  -d '{"name":"Atorvastatina","dosage":"10mg"}'

# 4) Crear horario (usar medId devuelto)
curl -X POST http://localhost:4000/schedules \
  -H "Content-Type: application/json" \
  -d '{"medicationId":"<medId>","timeLocal":"21:00","daysCsv":"mon,tue,wed","snoozeMin":10}'

# 5) Registrar toma (usar medId y scheduleId)
curl -X POST http://localhost:4000/intakes \
  -H "Content-Type: application/json" \
  -d '{"medicationId":"<medId>","scheduleId":"<scheduleId>","scheduledFor":"2025-09-19T21:00:00.000Z","action":"CONFIRMED","actionAt":"2025-09-19T21:02:00.000Z"}'
🧰 Scripts útiles
bash
Copiar código
npm run dev           # desarrollo (ts-node-dev)
npm run build         # compilar a JS (dist/)
npm start             # ejecutar dist/index.js
npx prisma generate   # generar cliente Prisma
npx prisma migrate dev --name <msg>  # crear/aplicar migración
npx prisma studio     # UI para la DB
✅ Convenciones
Soft delete en medicamentos: no se eliminan físicamente; se ocultan en listados.

Validación con Zod en cuerpo y params; respuestas con códigos HTTP consistentes.

Fechas en ISO 8601 (UTC) para campos de tiempo.

🗺️ Próximos pasos
Autenticación JWT (roles PATIENT/CAREGIVER).

Documentación Swagger/OpenAPI.

Tests con Jest + supertest.

Modo offline-first (sync pull/push).

CI/CD con GitHub Actions.