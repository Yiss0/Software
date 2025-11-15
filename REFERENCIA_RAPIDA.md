# 🗂️ REFERENCIA RÁPIDA - PastillApp v2.0

## 📍 Localización Rápida de Cambios

### Backend Endpoints

| Método | Ruta | Descripción | Ubicación |
|--------|------|-------------|-----------|
| PUT | `/patients/:id` | Actualizar perfil completo | `index.ts:L137` |
| PATCH | `/patients/:id` | Actualizar perfil parcial | `index.ts:L188` |
| POST | `/patients/:id/profile-image` | Upload de foto | `index.ts:L1311` |
| POST | `/chatbot/interpret` | Interpretar mensaje IA | `index.ts:L1148` |

### Funciones IA

| Función | Archivo | Línea | Descripción |
|---------|---------|-------|-------------|
| `analyzeChatIntent` | `chatbotService.ts:L54` | 54 | Clasifica intención |
| `extractMedicationDetails` | `chatbotService.ts:L139` | 139 | Extrae detalles medicamento |
| `getConversationalResponse` | `chatbotService.ts:L232` | 232 | Respuesta conversacional |
| `validateMedicationDetails` | `chatbotService.ts:L349` | 349 | Valida medicamento |
| `parseTimeToHHMM` | `chatbotService.ts:L304` | 304 | Convierte hora a formato |

### Cambios Prisma

| Cambio | Modelo | Campo | Tipo |
|--------|--------|-------|------|
| NUEVO | User | profileImageUrl | String? |

### Cambios Frontend

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `perfil.tsx` (paciente) | Edición + upload + URLs | ~500 |
| `perfil.tsx` (cuidador) | Edición + upload + URLs | ~500 |
| `apiService.ts` | Tipo UserProfile | +1 propiedad |

---

## 🧭 Navegación por Documento

| Busco... | Leo... | Sección |
|----------|--------|---------|
| Qué cambió totalmente | RESUMEN_VISUAL_FINAL.md | "LOGROS ALCANZADOS" |
| Cómo comenzar | README.md | "Inicio Rápido" |
| Detalles IA | CHATBOT_IMPROVEMENTS.md | "Prompts Mejorados" |
| Cómo testear | CHATBOT_TESTING.md | "Prueba 1.1" |
| Cambiar servidor | FAQ_CAMBIO_SERVIDOR.md | "Escenario 1" |
| Imágenes detalle | IMAGE_STORAGE_ARCHITECTURE.md | "Solución Implementada" |
| Índice general | DOCUMENTACION_INDICE.md | "Matriz de Navegación" |

---

## 🔐 Checklist de Verificación

### ¿Funciona todo?
- [ ] Backend compila sin errores: `npx tsc --noEmit` (Backend ✅)
- [ ] Frontend compila sin errores: `npx tsc --noEmit` (Frontend ✅)
- [ ] API responds: `curl http://192.168.100.3:3001/health`
- [ ] Upload funciona: Editar perfil → Cambiar foto → Guardar
- [ ] URLs se guardan: Ver BD en `profiles` → `profileImageUrl`
- [ ] URLs se cargan: Recargar perfil → Foto aparece

### Casos IA Probados
- [ ] Agregar medicamento: "Paracetamol cada 8 horas"
- [ ] Ver medicamentos: "¿Qué medicamentos tengo?"
- [ ] Confirmar toma: "Ya me tomé la pastilla"
- [ ] Saludos: "Hola"
- [ ] Despedidas: "Adiós"
- [ ] Ayuda: "¿Cómo funciona?"
- [ ] Desconocido: "¿Cuál es la capital?"

---

## 💾 Comandos Útiles

```bash
# Backend setup
cd backend
npm install
npx prisma migrate dev --name add-profile-image-url
npm run dev

# Frontend setup
cd frontend
npm install
npm start

# TypeScript check
npx tsc --noEmit

# API test
curl http://192.168.100.3:3001/health

# Upload test
curl -F "profileImage=@photo.jpg" \
  "http://192.168.100.3:3001/patients/USER_ID/profile-image"

# Chatbot test
curl -X POST "http://192.168.100.3:3001/chatbot/interpret" \
  -H "Content-Type: application/json" \
  -d '{"message":"Quiero agregar paracetamol","patientId":"USER_ID"}'
```

---

## 🎯 Intenciones IA - Ejemplos

| Intent | Ejemplo Usuario | Respuesta | Código |
|--------|---|---|---|
| ADD_MEDICINE | "Agregar paracetamol cada 8 horas" | ✅ + medicamento creado | `case "ADD_MEDICINE"` |
| VIEW_SCHEDULE | "¿Mis medicamentos?" | 📋 Lista completa | `case "VIEW_SCHEDULE"` |
| CONFIRM_INTAKE | "Tomé la pastilla" | ✅ Registrada | `case "CONFIRM_INTAKE"` |
| GREETING | "Hola" | 👋 Respuesta amigable | `case "GREETING"` |
| FAREWELL | "Adiós" | 👋 Despedida | `case "FAREWELL"` |
| HELP | "¿Cómo uso?" | 📖 Guía | `case "HELP"` |
| UNKNOWN | "¿Cuál es la capital?" | ❓ Fallback | `case "UNKNOWN"` |

---

## 🔍 Troubleshooting Rápido

| Problema | Causa | Solución |
|----------|-------|----------|
| 404 en PUT/PATCH | Endpoint no existe | Reiniciar backend |
| Foto no se guarda | Multer no instalado | `npm install multer` |
| Foto no se muestra | URL localhost | Verificar Config.ts API_URL |
| Chatbot no responde | GEMINI_API_KEY vacío | Configurar .env |
| TypeError compilación | TS types | `npm install @types/multer` |

---

## 📊 Parámetros Clave

### Multer
```typescript
storage: diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const ext = file.originalname.split('.').pop() || 'jpg';
    const uniqueName = `${Date.now()}-${Math.random()...}.${ext}`;
    cb(null, uniqueName);
  }
})
```

### IA Temperatures
```
Clasificación: 0.2   (consistencia máxima)
Extracción:    0.15  (precisión máxima)
Conversación:  0.7   (naturalidad)
```

### Timeouts
```
Requests API: 10000ms (10 segundos)
```

---

## 🎨 Arquitectura Visual

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENTE (APP)                      │
│  ┌─────────────────────────────────────────────────────┐
│  │  Perfil.tsx                                         │
│  │  • Edición de campos                                │
│  │  • Upload de foto                                   │
│  │  • Conversión URL (relativa → absoluta)             │
│  └─────────────┬───────────────────────────────────────┘
│                │
│                ▼
│  ┌─────────────────────────────────────────────────────┐
│  │  API_URL = http://192.168.100.3:3001                │
│  │  (dinámico según ambiente)                          │
│  └─────────────┬───────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│                  SERVIDOR BACKEND                       │
│  ┌─────────────────────────────────────────────────────┐
│  │  index.ts                                           │
│  │  • PUT /patients/:id        (editar perfil)         │
│  │  • PATCH /patients/:id      (actualizar)            │
│  │  • POST /patients/:id/image (upload foto)           │
│  │  • POST /chatbot/interpret  (IA)                    │
│  └─────────────┬───────────────────────────────────────┘
│                │
│        ┌───────┴───────┐
│        ▼               ▼
│  ┌──────────────┐  ┌──────────────────┐
│  │ Multer/FS    │  │ Prisma/BD        │
│  │ /uploads/... │  │ profileImageUrl  │
│  └──────────────┘  └──────────────────┘
│        ▲               ▲
│        └───────┬───────┘
│                │
│  ┌─────────────┴───────────────────────┐
│  │  URL devuelta: "uploads/abc.jpg"    │
│  │  (ruta relativa)                    │
│  └─────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────────────────┐
│              FRONTEND: Construcción URL                 │
│  ┌─────────────────────────────────────────────────────┐
│  │ if (!imageUrl.startsWith('http')) {                 │
│  │   imageUrl = `${API_URL}/${imageUrl}`              │
│  │   // = http://192.168.100.3:3001/uploads/abc.jpg   │
│  │ }                                                   │
│  └─────────────────────────────────────────────────────┘
│        ▼
│  ┌─────────────────────────────────────────────────────┐
│  │ URL completa mostrada en Image component            │
│  └─────────────────────────────────────────────────────┘
└─────────────────────────────────────────────────────────┘
```

---

## ✅ Estado Final

| Componente | Status | % |
|------------|--------|---|
| Perfil edición | ✅ Completo | 100% |
| Upload fotos | ✅ Completo | 100% |
| Chatbot IA | ✅ Completo | 100% |
| Portabilidad | ✅ Completo | 100% |
| Documentación | ✅ Completo | 100% |
| Testing | ✅ Documentado | 100% |
| **TOTAL** | **✅ LISTO** | **100%** |

---

**Referencia Rápida Actualizada**: 14 Nov 2025  
**Para preguntas específicas**: Consult DOCUMENTACION_INDICE.md
