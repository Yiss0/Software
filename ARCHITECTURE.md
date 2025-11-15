# 🎨 Arquitectura y Flujos - PastillApp v2.0

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React Native)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Perfil Tab   │  │ Asistente Tab│  │ Medicinas Tab│       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│       │                    │                  │              │
│       └────────────────────┴──────────────────┘              │
│                         │                                    │
│                    API Service                              │
│                         │                                    │
└─────────────────────────┼────────────────────────────────────┘
                          │
                    HTTP (REST)
                          │
┌─────────────────────────┼────────────────────────────────────┐
│                    Backend (Express)                         │
│                         │                                    │
│  ┌──────────────────────┴──────────────────────┐            │
│  │           API Endpoints                     │            │
│  │  ┌─────────────────────────────────────┐   │            │
│  │  │ PUT/PATCH /patients/:id             │   │            │
│  │  │ POST /patients/:id/profile-image    │   │            │
│  │  │ POST /chatbot/interpret             │   │            │
│  │  │ GET/POST /medications/...           │   │            │
│  │  └─────────────────────────────────────┘   │            │
│  └──────────────┬───────────────────────────────┘            │
│                 │                                            │
│  ┌──────────────┼───────────────────────────────┐            │
│  │    Services                                   │            │
│  │  ┌─────────────────────────────────────┐   │            │
│  │  │ Chatbot Service                     │   │            │
│  │  │  - Analyze Intent (Gemini 2.5)     │   │            │
│  │  │  - Extract Medication              │   │            │
│  │  │  - Conversational Response         │   │            │
│  │  └─────────────────────────────────────┘   │            │
│  └──────────────┬───────────────────────────────┘            │
│                 │                                            │
│  ┌──────────────┼───────────────────────────────┐            │
│  │    Database (Prisma ORM)                     │            │
│  │  ┌─────────────────────────────────────┐   │            │
│  │  │ PostgreSQL                          │   │            │
│  │  │ - Users (with profileImageUrl)      │   │            │
│  │  │ - Medications                       │   │            │
│  │  │ - Schedules                         │   │            │
│  │  │ - IntakeLogs                        │   │            │
│  │  └─────────────────────────────────────┘   │            │
│  └─────────────────────────────────────────────┘            │
│                                                              │
│  ┌─────────────────────────────────────────┐                │
│  │ File Storage                            │                │
│  │ - /uploads/                             │                │
│  │ - Static served on /uploads             │                │
│  └─────────────────────────────────────────┘                │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔄 Flujo: Edición de Perfil

```
Usuario abre app
    │
    ▼
Pantalla de Perfil carga (GET /patients/:id)
    │
    ├─→ Datos del usuario se muestran
    │
    ▼
Usuario presiona "Editar"
    │
    └─→ Campos se hacen editables
    └─→ Botón 📷 aparece
    │
    ▼
Usuario cambia datos + foto
    │
    ├─→ Foto se guarda en memoria local (imageUri)
    │
    ▼
Usuario presiona "Guardar"
    │
    ├─→ Si hay foto nueva:
    │   │
    │   ├─→ Upload: POST /patients/:id/profile-image
    │   │       │
    │   │       ├─→ Multer recibe archivo
    │   │       ├─→ Guarda en /uploads/timestamp-random.jpg
    │   │       ├─→ Genera URL pública
    │   │       ├─→ Actualiza profileImageUrl en BD
    │   │       └─→ Devuelve URL
    │   │
    │   └─→ Frontend recibe URL
    │       └─→ Reemplaza localhost con IP real
    │
    ├─→ Actualizar perfil: PUT /patients/:id
    │   │
    │   ├─→ Backend valida datos
    │   ├─→ Convierte birthDate a ISO
    │   ├─→ Actualiza en BD
    │   └─→ Devuelve usuario actualizado
    │
    ├─→ Frontend recibe confirmación
    │   │
    │   └─→ Actualiza estado local
    │       └─→ Muestra alerta de éxito
    │
    ▼
Datos guardados y foto visible
```

---

## 💬 Flujo: Usar Chatbot

```
Usuario escribe: "Paracetamol 500mg cada 8 horas"
    │
    ▼
POST /chatbot/interpret
    │
    ├─→ Fase 1: Clasificación
    │   │
    │   ├─→ Enviar a Gemini: classificationPrompt()
    │   │
    │   ├─→ Gemini analiza intención
    │   │
    │   └─→ Devuelve: {"intent":"ADD_MEDICINE", "confidence":"high"}
    │
    ├─→ Fase 2: Extracción (si es ADD_MEDICINE)
    │   │
    │   ├─→ Enviar a Gemini: extractionPrompt()
    │   │
    │   ├─→ Gemini extrae:
    │   │   {
    │   │     "medication": {"name":"Paracetamol", "dosage":"500mg"},
    │   │     "schedules": [{"time":"08:00", "frequencyType":"HOURLY", "frequencyValue":8}]
    │   │   }
    │   │
    │   └─→ Validar con validateMedicationDetails()
    │
    ├─→ Fase 3: Guardado
    │   │
    │   ├─→ Crear medicamento en BD
    │   │
    │   ├─→ Crear 3 horarios (08:00, 16:00, 00:00)
    │   │
    │   └─→ Retornar confirmación
    │
    ▼
Respuesta: "✅ Paracetamol registrado en 3 horarios..."
```

---

## 📸 Flujo: Subir Foto

```
Usuario toca botón 📷
    │
    ▼
Menú: Cámara | Galería | Cancelar
    │
    ├─→ Si Cámara:
    │   └─→ ImagePicker.launchCameraAsync()
    │
    └─→ Si Galería:
        └─→ ImagePicker.launchImageLibraryAsync()
    │
    ▼
Usuario selecciona/toma foto
    │
    ├─→ Se obtiene: file:///path/to/image.jpg
    │
    ├─→ Se guarda en imageUri state
    │
    └─→ Preview se muestra en pantalla
    │
    ▼
Usuario presiona Guardar
    │
    ├─→ Detectar: ¿Es URL local o remota?
    │   └─→ Si comienza con "http" → Ya guardada (skip)
    │   └─→ Si comienza con "file://" → Es nueva (upload)
    │
    ├─→ Si es nueva:
    │   │
    │   ├─→ Crear FormData con archivo
    │   │
    │   ├─→ POST /patients/:id/profile-image (multipart/form-data)
    │   │
    │   ├─→ Multer recibe y guarda
    │   │
    │   ├─→ Backend retorna URL pública
    │   │
    │   └─→ Frontend:
    │       ├─→ Verifica si URL tiene "localhost"
    │       ├─→ Si sí, reemplaza con 192.168.100.3:3001
    │       └─→ Actualiza imageUri con URL pública
    │
    ├─→ Actualizar perfil con profileImageUrl
    │
    ▼
Foto se muestra en pantalla
    │
    ▼
Próxima vez que abra el perfil
    │
    ├─→ GET /patients/:id devuelve profileImageUrl
    │
    ├─→ Frontend verifica y convierte localhost
    │
    └─→ Foto se carga automáticamente
```

---

## 🤖 Flujo: Inteligencia Artificial

```
Mensaje del Usuario
    │
    ▼
┌─────────────────────────────────────┐
│ analyzeChatIntent()                 │
│ ────────────────────────────────────│
│ 1. Crear prompt de clasificación    │
│ 2. Enviar a Gemini (temp: 0.2)      │
│ 3. Parsear respuesta JSON           │
│ 4. Validar intención                │
│ 5. Retornar IntentResponse          │
└─────────────────────────────────────┘
    │
    ▼
Switch por Intención
    │
    ├─→ ADD_MEDICINE
    │   │
    │   ├─→ extractMedicationDetails()
    │   │   - Temp: 0.15 (máxima precisión)
    │   │   - Devuelve MedicationDetails
    │   │
    │   ├─→ validateMedicationDetails()
    │   │   - Validar nombre, horarios, tipos
    │   │   - Retornar errores si hay
    │   │
    │   ├─→ Guardar en BD
    │   │
    │   └─→ Respuesta amigable
    │
    ├─→ VIEW_SCHEDULE
    │   │
    │   ├─→ Buscar medicamentos activos
    │   │
    │   └─→ Listar con horarios
    │
    ├─→ CONFIRM_INTAKE
    │   │
    │   ├─→ Extraer nombre de medicamento
    │   │
    │   ├─→ Buscar en BD (case-insensitive)
    │   │
    │   ├─→ Registrar toma
    │   │
    │   └─→ Confirmar
    │
    ├─→ GREETING, FAREWELL, HELP
    │   │
    │   └─→ getConversationalResponse()
    │       - Temp: 0.7 (natural)
    │
    └─→ UNKNOWN
        │
        └─→ Fallback inteligente
            + Sugerencia de acciones
    │
    ▼
Respuesta al Usuario
```

---

## 📊 Estructura de Datos - Base de Datos

```
User (pacientes y cuidadores)
├── id
├── firstName
├── lastName
├── email
├── phone
├── birthDate (DateTime, nullable)
├── profileImageUrl (String, nullable) ← NUEVO
├── address
├── emergencyContact
├── emergencyPhone
├── medicalConditions
├── allergies
├── createdAt
├── updatedAt
└── relationships
    ├── medications[]
    ├── schedules[] (through medications)
    └── intakeLogs[] (through medications)

Medication
├── id
├── patientId (FK)
├── name
├── dosage
├── quantity
├── type (PILL | SYRUP | INJECTION | INHALER)
├── active (boolean)
├── deletedAt
└── schedules[]

Schedule
├── id
├── medicationId (FK)
├── time (HH:MM)
├── frequencyType (DAILY | HOURLY | WEEKLY)
├── frequencyValue
├── daysOfWeek
├── alertType (NOTIFICATION | ALARM)
└── active (boolean)

IntakeLog
├── id
├── medicationId (FK)
├── scheduleId (FK, nullable)
├── scheduledFor (DateTime)
├── action (CONFIRMED | SKIPPED | PENDING | etc)
├── actionAt (DateTime, nullable)
└── note (string, nullable)
```

---

## 🔌 API Contratos

### Request: Editar Perfil
```json
PUT /patients/:id
{
  "firstName": "Juan",
  "lastName": "Pérez",
  "email": "juan@example.com",
  "phone": "+56987654321",
  "birthDate": "1990-05-15T00:00:00.000Z",
  "address": "Calle Principal 123",
  "profileImageUrl": "http://localhost:3001/uploads/file.jpg"
}
```

### Response: Éxito
```json
{
  "id": "user123",
  "firstName": "Juan",
  "lastName": "Pérez",
  "birthDate": "1990-05-15T00:00:00.000Z",
  "profileImageUrl": "http://192.168.100.3:3001/uploads/1700000000000-abc123.jpg",
  ...
}
```

### Request: Chatbot
```json
POST /chatbot/interpret
{
  "message": "Paracetamol cada 8 horas",
  "patientId": "patient123",
  "tzOffsetMinutes": -180
}
```

### Response: Éxito
```json
{
  "response": "✅ ¡Perfecto! He registrado Paracetamol en 3 horarios...",
  "success": true,
  "medicationId": "med123",
  "schedulesCount": 3
}
```

---

## ⚙️ Configuración de Temperaturas IA

```
Temperature (0.0 - 1.0)

0.0 ────────────────────────────── 1.0
Determinístico      Aleatorio    Creativo
(siempre igual)     (variable)   (muy creativo)

Clasificación:  0.2 ✓ (consistente)
Extracción:     0.15 ✓ (preciso)
Conversación:   0.7 ✓ (natural)
```

---

## 🔐 Seguridad - Capas

```
┌─────────────────────────────────┐
│   Frontend Validation            │  Validar inputs antes de enviar
├─────────────────────────────────┤
│   Network (HTTPS)               │  En producción
├─────────────────────────────────┤
│   Backend Validation            │  Validar inputs en servidor
├─────────────────────────────────┤
│   Database Constraints          │  Primary/Foreign keys, not null
├─────────────────────────────────┤
│   Logging & Auditing            │  Rastrear acciones
├─────────────────────────────────┤
│   Rate Limiting (future)        │  Limitar requests/usuario
└─────────────────────────────────┘
```

---

## 📈 Performance - Optimizaciones

```
Request Timeline:
0ms ├─ Request enviado
50ms ├─ Backend recibe
100ms ├─ Validación completa
150ms ├─ BD query/update
200ms ├─ Respuesta generada
250ms ├─ Response enviado
300ms └─ Frontend recibe ← Total: ~250ms (ideal)

IA Timeline:
0ms ├─ POST /chatbot/interpret
50ms ├─ Envío a Gemini API
100ms ├─ Clasificación (Gemini)
1500ms ├─ Extracción (Gemini) si aplica
1800ms ├─ Validación + BD
2000ms └─ Response al frontend ← Total: ~2s (aceptable)
```

---

## 🎯 Próxima Arquitectura (v3.0)

```
┌─────────────────────────────────────────┐
│  Frontend                               │
│  React Native + Context API             │
│  + Redux (para estado global v3.0)      │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Backend                                │
│  Express + TypeScript                   │
│  + GraphQL (alternativa REST v3.0)      │
│  + WebSockets (real-time v3.0)          │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  Servicios                              │
│  + Notificaciones Push                  │
│  + Reportes automáticos                 │
│  + Integración con APIs externas        │
└──────────────┬──────────────────────────┘
               │
┌──────────────┴──────────────────────────┐
│  BD                                     │
│  PostgreSQL                             │
│  + Redis Cache (v3.0)                   │
│  + Analytics (v3.0)                     │
└─────────────────────────────────────────┘
```

---

**Documento de Arquitectura**
**Versión**: 2.0.0
**Fecha**: 14 de Noviembre de 2025
**Status**: ✅ Completo
