# 💊 PastillApp - Gestor Inteligente de Medicamentos

**Una aplicación móvil que te ayuda a recordar y gestionar tus medicamentos con asistencia de IA**

Versión: **2.0.0**

Autores: Gabriel Cardenas - Jesús Contreras - Yessenia Moreno - Ignacio Neira

---

## 🎯 Características Principales

### 📱 Perfil de Usuario
- ✅ Visualización y edición de datos personales
- ✅ Carga de foto de perfil (cámara/galería)
- ✅ Persistencia de datos en base de datos
- ✅ Soporte para pacientes y cuidadores

### 🤖 Asistente IA (Chatbot)
- ✅ Agregar medicamentos por voz/texto
- ✅ Ver lista de medicamentos y horarios
- ✅ Confirmar que tomaste un medicamento
- ✅ Saludos y ayuda contextual
- ✅ 7 intenciones diferentes soportadas
- ✅ Respuestas amigables y precisas

### 💊 Gestión de Medicamentos
- ✅ Crear medicamentos con múltiples horarios
- ✅ Ver horarios de cada medicamento
- ✅ Confirmar tomas completadas
- ✅ Sincronización automática

### 📊 Interfaz Intuitiva
- ✅ Diseño moderno y responsive
- ✅ Emojis y mensajes claros
- ✅ Navegación sencilla
- ✅ Alertas informativas

---

## 🚀 Inicio Rápido

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

## 📖 Documentación

- [RESUMEN_FINAL.md](./RESUMEN_FINAL.md) - Resumen completo de cambios y mejoras
- [CHATBOT_IMPROVEMENTS.md](./CHATBOT_IMPROVEMENTS.md) - Detalle de mejoras en IA
- [CHATBOT_TESTING.md](./CHATBOT_TESTING.md) - Guía de testing
- [IMAGE_STORAGE_ARCHITECTURE.md](./IMAGE_STORAGE_ARCHITECTURE.md) - Arquitectura de almacenamiento de imágenes (portabilidad a otros servidores)
- [CHATBOT_USAGE_GUIDE.md](./CHATBOT_USAGE_GUIDE.md) - Cómo usar el chatbot
- [CHECKLIST_FINAL.md](./CHECKLIST_FINAL.md) - Verificación de funcionalidades

---

## 🔧 Tecnologías

### Backend
- Express.js
- TypeScript
- Prisma ORM
- Gemini 2.5 Flash API
- Multer (file upload)

### Frontend
- React Native / Expo
- TypeScript
- Context API
- Lucide React Icons

### Base de Datos
- PostgreSQL

---

## 📋 Requisitos

- Node.js 16+
- npm o yarn
- PostgreSQL 12+
- Android/iOS emulator o dispositivo físico

---

## 🎮 Casos de Uso

### Para Pacientes
1. Editar tu perfil y subir foto
2. Habla con el asistente para agregar medicamentos
3. Consulta tus medicamentos y horarios
4. Confirma cuando tomas un medicamento

### Para Cuidadores
1. Edita tu propio perfil
2. Supervisa a pacientes bajo tu cuidado
3. Consulta el historial de medicamentos

---

## 🤝 Flujo de Uso Típico

```
1. Usuario abre app
   ↓
2. Se autentica (login/registro)
   ↓
3. Ve opción de editar perfil o abrir chatbot
   ↓
4. En chatbot: "Quiero agregar paracetamol cada 8 horas"
   ↓
5. Asistente IA procesa y crea medicamento
   ↓
6. Usuario ve medicamento en lista de horarios
   ↓
7. A la hora programada, recibe notificación
   ↓
8. Confirma que tomó el medicamento
```

---

## 🔐 Seguridad

- Validación de inputs en backend y frontend
- Manejo robusto de errores
- Timeouts en requests API
- Logs para auditoría
- Contraseñas hasheadas en BD

---

## 📊 Estructura del Proyecto

```
PastillApp/
├── backend/
│   ├── src/
│   │   ├── index.ts (endpoints principales)
│   │   └── services/
│   │       └── chatbotService.ts (lógica IA)
│   ├── prisma/
│   │   └── schema.prisma (modelo BD)
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── (tabs)/
│   │   │   └── perfil.tsx
│   │   └── (caregiver)/
│   │       └── (tabs)/perfil.tsx
│   ├── services/
│   │   └── apiService.ts
│   └── package.json
├── RESUMEN_FINAL.md
├── CHATBOT_IMPROVEMENTS.md
└── README.md (este archivo)
```

---

## 🐛 Troubleshooting

### Error: GEMINI_API_KEY no configurada
→ Añade tu clave en `.env`

### Foto no se carga
→ Verifica que localhost se convierta a IP correcta

### Medicamento no se guarda
→ Revisa logs `[chatbot*]` en consola del servidor

---

## 🚀 Próximas Mejoras

- [ ] Historial de conversación del chatbot
- [ ] Estadísticas de cumplimiento
- [ ] Reportes PDF
- [ ] Integración con farmacias
- [ ] Análisis de efectividad de medicamentos
- [ ] Machine Learning para predicciones

---

## 📞 Contacto y Soporte

Para reportar bugs o sugerencias, abre un issue en el repositorio.

---

**Estado**: ✅ Production Ready
**Última actualización**: 14 de Noviembre de 2025
**Versión**: 2.0.0