# 🧪 Guía de Testing del Chatbot Mejorado

## Cómo Probar Cada Funcionalidad

### 1️⃣ Agregar Medicamento (ADD_MEDICINE)

#### Prueba 1: Paracetamol simple
```
Usuario: "Quiero agregar paracetamol 500mg cada 8 horas"
Esperado: 
- ✅ Medicamento creado
- ✅ 3 horarios (08:00, 16:00, 00:00)
- ✅ Respuesta con confirmación
```

#### Prueba 2: Antibiótico con horario específico
```
Usuario: "Añade amoxicilina 250mg a las 9 de la mañana y a las 9 de la noche"
Esperado:
- ✅ Medicamento creado
- ✅ 2 horarios (09:00, 21:00)
```

#### Prueba 3: Vitamina semanal
```
Usuario: "Vitamina D los lunes, miércoles y viernes a las 7 de la mañana"
Esperado:
- ✅ Medicamento creado
- ✅ Horario con frequencyType: WEEKLY
- ✅ daysOfWeek: "1,3,5"
```

#### Prueba 4: Sin nombre del medicamento (debe fallar gracefully)
```
Usuario: "Quiero algo cada 12 horas"
Esperado:
- ⚠️ Mensaje pidiendo el nombre del medicamento
- ✅ No crash, respuesta clara
```

---

### 2️⃣ Ver Horarios/Medicamentos (VIEW_SCHEDULE)

#### Prueba 1: Con medicamentos registrados
```
Usuario: "¿Qué medicamentos tengo?"
Esperado:
- ✅ Lista de medicamentos activos
- ✅ Cada uno con sus horarios
```

#### Prueba 2: Sin medicamentos registrados
```
Usuario: "Muéstrame mis medicinas"
Esperado:
- ✅ "No tienes medicamentos registrados"
- ✅ Invitación a agregar uno
```

---

### 3️⃣ Confirmar Toma (CONFIRM_INTAKE)

#### Prueba 1: Confirmar medicamento existente
```
Usuario: "Ya me tomé el paracetamol"
Esperado:
- ✅ Toma registrada como CONFIRMED
- ✅ Confirmación con hora
```

#### Prueba 2: Confirmar medicamento que no existe
```
Usuario: "Tomé un medicamento inexistente"
Esperado:
- ⚠️ "No encontré un medicamento con ese nombre"
- ✅ Pedir que dé el nombre exacto
```

---

### 4️⃣ Saludos (GREETING)

#### Prueba 1: Hola simple
```
Usuario: "Hola"
Esperado:
- ✅ Respuesta amigable
- ✅ Contextual a medicamentos
```

#### Prueba 2: Buenos días
```
Usuario: "Buenos días, ¿cómo estás?"
Esperado:
- ✅ Saludo caloroso
- ✅ Máx 20 palabras
```

---

### 5️⃣ Despedidas (FAREWELL)

#### Prueba 1: Adiós
```
Usuario: "Adiós"
Esperado:
- ✅ Despedida amigable
- ✅ Recordatorio sobre medicamentos
```

#### Prueba 2: Hasta luego
```
Usuario: "Nos vemos más tarde"
Esperado:
- ✅ Despedida contextual
```

---

### 6️⃣ Pedir Ayuda (HELP)

#### Prueba 1: ¿Cómo funciona?
```
Usuario: "¿Cómo funciona esto?"
Esperado:
- ✅ Guía de acciones disponibles
- ✅ Ejemplos específicos
```

#### Prueba 2: Necesito ayuda
```
Usuario: "Necesito ayuda"
Esperado:
- ✅ Menú de opciones
- ✅ Instrucciones claras
```

---

### 7️⃣ Desconocido (UNKNOWN)

#### Prueba 1: Pregunta sin relación
```
Usuario: "¿Cuál es la capital de Francia?"
Esperado:
- ✅ Respuesta amigable
- ✅ Redirección a funcionalidades de medicamentos
```

---

## 📋 Checklist de Testing

- [ ] Prueba 1.1: Paracetamol simple
- [ ] Prueba 1.2: Antibiótico con dos horarios
- [ ] Prueba 1.3: Vitamina semanal
- [ ] Prueba 1.4: Sin nombre del medicamento
- [ ] Prueba 2.1: Con medicamentos
- [ ] Prueba 2.2: Sin medicamentos
- [ ] Prueba 3.1: Confirmar existente
- [ ] Prueba 3.2: Confirmar inexistente
- [ ] Prueba 4.1: Hola simple
- [ ] Prueba 4.2: Buenos días
- [ ] Prueba 5.1: Adiós
- [ ] Prueba 5.2: Hasta luego
- [ ] Prueba 6.1: ¿Cómo funciona?
- [ ] Prueba 6.2: Necesito ayuda
- [ ] Prueba 7.1: Pregunta sin relación

---

## 🔍 Cómo Revisar Logs

En la consola del servidor, deberías ver:

```
[chatbot] Procesando mensaje de cmgmwmxfp000dteigtech1fg2: "Quiero agregar paracetamol"
[chatbot] Intención: ADD_MEDICINE (confianza: high)
[chatbot] Iniciando flujo: AGREGAR MEDICAMENTO
[chatbotService.extractMedicationDetails] Extrayendo de: "Quiero agregar paracetamol"
[chatbot] Medicamento creado: Paracetamol (clu9qk2ld000d)
[chatbot] 3 horario(s) creado(s)
```

---

## 🐛 Troubleshooting

### Problema: "No se captan los detalles"
**Solución:** Sé más específico. En lugar de "medicina", di "paracetamol" o "ibuprofeno".

### Problema: Hora incorrecta
**Solución:** Usa formato claro: "8 de la mañana", "08:00", "8am", o "20:00".

### Problema: Medicamento no se guarda
**Solución:** 
- Verifica que `GEMINI_API_KEY` esté configurada
- Revisa los logs del servidor
- Intenta una descripción más clara

### Problema: Confianza baja
**Solución:** Mensaje ambiguo. Intenta ser más explícito en tu entrada.

---

## 💻 API Directa (para testing avanzado)

### Endpoint
```
POST /chatbot/interpret
```

### Request
```json
{
  "message": "Quiero agregar paracetamol cada 8 horas",
  "patientId": "cmgmwmxfp000dteigtech1fg2",
  "tzOffsetMinutes": -180
}
```

### Response Exitosa (ADD_MEDICINE)
```json
{
  "response": "✅ ¡Perfecto! He registrado **Paracetamol** en 3 horarios diferentes. Recibirás recordatorios puntualmente.",
  "success": true,
  "medicationId": "cluvxyz123abc",
  "schedulesCount": 3
}
```

### Response Fallo (Validación)
```json
{
  "response": "Necesito más información: Falta el nombre del medicamento, Falta al menos un horario. ¿Podrías ser más específico?",
  "success": false
}
```

---

## 📊 Métricas a Monitorear

1. **Tasa de éxito**: % de mensajes procesados correctamente
2. **Confianza promedio**: Validez de clasificaciones
3. **Tiempo de respuesta**: Latencia de la IA
4. **Errores**: Exceptions o timeouts

---

**Última actualización:** 14 de Noviembre de 2025
