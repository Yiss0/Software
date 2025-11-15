# 📚 Referencia Rápida - PastillApp v2.0

## 🚀 Arranque Rápido

### Backend
```bash
cd backend
npm install
npx prisma migrate dev
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm start
```

---

## 🔗 Endpoints Principales

### Perfil de Usuario
```
PUT /patients/:id              # Actualizar perfil completo
PATCH /patients/:id            # Actualizar parcialmente
GET /patients/:id              # Obtener perfil
POST /patients/:id/profile-image  # Subir foto
```

### Chatbot
```
POST /chatbot/interpret        # Procesar mensaje de usuario
```

### Medicamentos
```
GET /patients/:patientId/medications
POST /patients/:patientId/medications
GET /medications/:id
PUT /medications/:id
DELETE /medications/:id
GET /medications/:medId/schedules
```

---

## 💬 Ejemplos de Chatbot

### Agregar Medicamento
```
Usuario: "Paracetamol 500mg cada 8 horas"
Respuesta: "✅ ¡Perfecto! He registrado Paracetamol en 3 horarios..."
```

### Ver Medicamentos
```
Usuario: "¿Qué medicamentos tengo?"
Respuesta: "Tienes 2 medicamentos activos: ..."
```

### Confirmar Toma
```
Usuario: "Ya me tomé la pastilla"
Respuesta: "✅ Perfecto, registré que tomaste Paracetamol..."
```

---

## 📁 Estructura de Carpetas

```
PastillApp/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Endpoints
│   │   └── services/
│   │       └── chatbotService.ts # Lógica IA
│   ├── prisma/
│   │   └── schema.prisma         # BD Schema
│   ├── uploads/                  # Fotos de perfil
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   └── perfil.tsx        # Perfil paciente
│   │   └── (caregiver)/
│   │       └── perfil.tsx        # Perfil cuidador
│   ├── services/
│   │   ├── apiService.ts         # HTTP calls
│   │   └── chatbotService.ts     # Lógica chatbot frontend
│   └── package.json
└── docs/
    ├── RESUMEN_FINAL.md
    ├── CHATBOT_IMPROVEMENTS.md
    ├── CHATBOT_TESTING.md
    ├── CHATBOT_USAGE_GUIDE.md
    └── CHECKLIST_FINAL.md
```

---

## 🔑 Variables de Entorno

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/pastillapp
GEMINI_API_KEY=your_gemini_api_key
PORT=3001
SERVER_BASE_URL=http://192.168.100.3:3001
```

### Frontend (constants/Config.ts)
```typescript
export const API_URL = 'http://192.168.100.3:3001';
```

---

## 📊 Tipos Principales

### UserProfile
```typescript
interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;      // ISO format
  profileImageUrl?: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalConditions: string | null;
  allergies: string | null;
}
```

### ChatIntent
```typescript
type ChatIntent = 
  | 'ADD_MEDICINE'
  | 'VIEW_SCHEDULE'
  | 'CONFIRM_INTAKE'
  | 'GREETING'
  | 'FAREWELL'
  | 'HELP'
  | 'UNKNOWN';
```

### MedicationDetails
```typescript
interface MedicationDetails {
  medication: {
    name: string;
    dosage?: string;
    quantity?: number;
    type?: 'PILL' | 'SYRUP' | 'INJECTION' | 'INHALER';
  };
  schedules: {
    time: string;        // "HH:MM"
    frequencyType?: 'DAILY' | 'HOURLY' | 'WEEKLY';
    frequencyValue?: number;
    daysOfWeek?: string;
  }[];
}
```

---

## 🧪 Testing Rápido

### cURL - Editar Perfil
```bash
curl -X PUT http://localhost:3001/patients/USER_ID \
  -H "Content-Type: application/json" \
  -d '{"firstName":"Nuevo","lastName":"Nombre"}'
```

### cURL - Chatbot
```bash
curl -X POST http://localhost:3001/chatbot/interpret \
  -H "Content-Type: application/json" \
  -d '{
    "message":"Paracetamol cada 8 horas",
    "patientId":"USER_ID"
  }'
```

### cURL - Upload Foto
```bash
curl -X POST http://localhost:3001/patients/USER_ID/profile-image \
  -F "profileImage=@/ruta/a/foto.jpg"
```

---

## 🐛 Troubleshooting Común

### Problema: Foto no se carga
**Causa**: localhost no convertido a IP
**Solución**: Verifica `API_URL` en Config.ts

### Problema: Chatbot responde genéricamente
**Causa**: Mensaje muy vago
**Solución**: Sé más específico. Ej: "Paracetamol 500mg" en lugar de "medicina"

### Problema: Error 500 en upload
**Causa**: Carpeta uploads/ sin permisos
**Solución**: `mkdir uploads && chmod 755 uploads`

### Problema: Medicamento duplicado
**Causa**: BD constraint
**Solución**: Elimina primero, luego agrega de nuevo

---

## 📈 Métricas y Logs

### Logs del Servidor
```
[chatbot] Procesando mensaje...
[chatbotService.analyzeChatIntent] Clasificando...
[chatbotService.extractMedicationDetails] Extrayendo...
[Profile Image Upload] Saving to user...
```

### Monitoreo
- Confianza de IA: `high` > `medium` > `low`
- Timeout: 10 segundos máximo
- Response time: < 3s típicamente

---

## 🔐 Seguridad Checklist

- ✅ Validar inputs
- ✅ Sanitizar strings
- ✅ Hash passwords
- ✅ Timeouts en requests
- ✅ Logs para auditoría
- ✅ CORS configurado
- ✅ Rate limiting (si aplica)

---

## 📚 Documentación Completa

- `README.md` - Visión general
- `SESION_RESUMEN.md` - Lo que se hizo hoy
- `RESUMEN_FINAL.md` - Detalles de cambios
- `CHATBOT_IMPROVEMENTS.md` - Mejoras IA
- `CHATBOT_TESTING.md` - Plan de testing
- `CHATBOT_USAGE_GUIDE.md` - Guía de usuario
- `CHECKLIST_FINAL.md` - Verificación

---

## 🚀 Próximos Pasos

1. **Corto plazo**: Historial de chatbot, estadísticas
2. **Mediano plazo**: Reportes, integración farmacias
3. **Largo plazo**: ML, API pública

---

## 📞 Contacto y Soporte

Para problemas:
1. Revisa los logs relevantes
2. Consulta la documentación
3. Abre issue en repositorio

---

**Última actualización**: 14 de Noviembre de 2025
**Estado**: ✅ Production Ready
**Versión**: 2.0.0
