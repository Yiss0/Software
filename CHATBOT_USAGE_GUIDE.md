# 💬 Guía Completa del Chatbot - Uso e Integración

## 📱 Cómo Usar el Chatbot en la App

### Acceso
1. Abre la app PastillApp
2. Navega a la pestaña **"Asistente"** (o similar según tu UI)
3. Escribe un mensaje en el input
4. El chatbot procesará y responderá en tiempo real

---

## 🎮 Ejemplos de Interacción

### 1️⃣ Agregar un Medicamento

**Usuario**: "Quiero agregar paracetamol"
**Asistente**: "¿A qué hora debes tomarlo y con qué frecuencia?"

**Usuario**: "Cada 8 horas, empezando a las 8 de la mañana"
**Asistente**: "✅ ¡Perfecto! He registrado **Paracetamol** en 3 horarios (08:00, 16:00, 00:00). Recibirás recordatorios puntualmente."

---

### 2️⃣ Ver Tus Medicamentos

**Usuario**: "¿Qué medicinas tengo?"
**Asistente**: 
```
Tienes 2 medicamento(s) activo(s):
• **Paracetamol** (500mg): 3 horario(s) (08:00, 16:00, 00:00)
• **Ibuprofeno** (200mg): 2 horario(s) (09:00, 21:00)
```

---

### 3️⃣ Confirmar que Tomaste un Medicamento

**Usuario**: "Ya me tomé el paracetamol"
**Asistente**: "✅ Perfecto, he registrado que tomaste **Paracetamol** hoy a las 08:15. ¡Excelente!"

---

### 4️⃣ Saludos y Conversación

**Usuario**: "Hola, ¿cómo estás?"
**Asistente**: "¡Hola! Estoy bien, gracias por preguntar. ¿Cómo puedo ayudarte con tus medicamentos hoy? 😊"

**Usuario**: "¿Cómo funciona esto?"
**Asistente**: 
```
¡Claro! Puedo ayudarte con:
• Agregar medicamentos: "Quiero agregar paracetamol cada 8 horas"
• Ver mis medicamentos: "¿Qué medicamentos tengo?"
• Confirmar que tomé un medicamento: "Ya me tomé la pastilla"
¿Qué necesitas?
```

---

### 5️⃣ Despedidas

**Usuario**: "Adiós"
**Asistente**: "¡Hasta luego! Recuerda tomar tus medicamentos a tiempo. 💊"

---

## 🔌 Integración con Frontend

### Endpoint API
```typescript
POST /chatbot/interpret
Content-Type: application/json

{
  "message": "Quiero agregar paracetamol cada 8 horas",
  "patientId": "cmgmwmxfp000dteigtech1fg2",
  "tzOffsetMinutes": -180  // Opcional: zona horaria del usuario
}
```

### Respuesta (Caso Exitoso)
```json
{
  "response": "✅ ¡Perfecto! He registrado **Paracetamol** en 3 horarios diferentes. Recibirás recordatorios puntualmente.",
  "success": true,
  "medicationId": "cluvxyz123abc",
  "schedulesCount": 3
}
```

### Respuesta (Caso Error)
```json
{
  "response": "Necesito más información: Falta el nombre del medicamento. ¿Podrías ser más específico?",
  "success": false
}
```

---

## 💻 Ejemplo de Código React Native

```typescript
import { useState } from 'react';
import { View, TextInput, Text, ScrollView, TouchableOpacity } from 'react-native';
import { API_URL } from '../constants/Config';
import { useAuth } from '../context/AuthContext';

export default function ChatbotScreen() {
  const { user } = useAuth();
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Array<{role: string, text: string}>>([]);
  const [loading, setLoading] = useState(false);

  const sendMessage = async () => {
    if (!message.trim()) return;

    // Agregar mensaje del usuario
    setMessages(prev => [...prev, { role: 'user', text: message }]);
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/chatbot/interpret`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          patientId: user?.id,
          tzOffsetMinutes: new Date().getTimezoneOffset() * -1 / 60 * 60
        })
      });

      const data = await response.json();

      // Agregar respuesta del asistente
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: data.response 
      }]);

      // Si fue exitoso, puedes actualizar la UI (ej: recargar medicamentos)
      if (data.success) {
        console.log('Acción completada:', data);
        // Aquí puedes trigger eventos para recargar listas, etc.
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        text: 'Perdón, algo salió mal. Intenta de nuevo.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20 }}>
      {/* Historial de mensajes */}
      <ScrollView style={{ flex: 1, marginBottom: 20 }}>
        {messages.map((msg, idx) => (
          <View key={idx} style={{ 
            marginBottom: 10, 
            padding: 10, 
            backgroundColor: msg.role === 'user' ? '#E0E7FF' : '#F3F4F6',
            borderRadius: 8,
            alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
            maxWidth: '85%'
          }}>
            <Text>{msg.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* Input */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <TextInput
          style={{ flex: 1, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 10 }}
          placeholder="Escribe aquí..."
          value={message}
          onChangeText={setMessage}
          editable={!loading}
        />
        <TouchableOpacity 
          onPress={sendMessage}
          disabled={loading}
          style={{ backgroundColor: '#2563EB', paddingHorizontal: 20, borderRadius: 8, justifyContent: 'center' }}
        >
          <Text style={{ color: '#FFFFFF', fontWeight: 'bold' }}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
```

---

## 🧠 Cómo Funciona Internamente

### Flujo de Clasificación
```
1. Usuario escribe: "Quiero agregar paracetamol"
   ↓
2. API llama a Gemini para clasificar intención
   ↓
3. Gemini responde: {"intent": "ADD_MEDICINE", "confidence": "high", "details": "paracetamol"}
   ↓
4. Backend entra en switch case ADD_MEDICINE
   ↓
5. Llama a Gemini de nuevo para extraer detalles
   ↓
6. Gemini responde con horarios, dosis, etc.
   ↓
7. Backend valida y guarda en BD
   ↓
8. Responde al frontend con confirmación
```

### Temperaturas de IA
- **Clasificación (0.2)**: Más consistente, menos variación
- **Extracción (0.15)**: Máxima precisión en datos estructurados
- **Conversación (0.7)**: Variación natural en respuestas

---

## 🎯 Casos de Uso Avanzados

### 1. Agregar Medicamento con Múltiples Horarios

**Usuario**: "Antibiótico, 500mg, a las 8, 14 y 20 horas"
**Resultado**: 3 horarios creados automáticamente

### 2. Frecuencias Complejas

**Usuario**: "Vitamina D los lunes, miércoles y viernes a las 7am"
**Resultado**: Medicamento con frequencyType: WEEKLY, daysOfWeek: "1,3,5"

### 3. Confirmación Flexible

**Usuario**: "Ya tomé mi pastilla de presión"
**Resultado**: Sistema encuentra el medicamento incluso si el nombre no es exacto

---

## ⚙️ Configuración Recomendada

### Variables de Entorno (.env)
```
GEMINI_API_KEY=tu_api_key_aqui
PORT=3001
SERVER_BASE_URL=http://192.168.100.3:3001
DATABASE_URL=postgresql://...
```

### Parámetros de Producción
```typescript
// chatbotService.ts - Ajustes para producción

const timeout = 10000; // 10 segundos
const temperature = {
  classification: 0.2,
  extraction: 0.15,
  conversation: 0.7
};
const maxTokens = {
  classification: 100,
  extraction: 500,
  conversation: 100
};
```

---

## 🐛 Troubleshooting

### Problema: Chatbot no entiende mi mensaje

**Solución**: Sé más específico
```
❌ "Agregar medicina"
✅ "Quiero agregar paracetamol 500mg cada 8 horas"
```

### Problema: Hora incorrecta

**Solución**: Usa formato claro
```
✅ "8 de la mañana"
✅ "08:00"
✅ "8am"
✅ "20:00"
```

### Problema: Medicamento no se guarda

**Solución**: 
1. Verifica que `GEMINI_API_KEY` esté configurada
2. Mira logs del servidor: `[chatbot]` y `[chatbotService.*]`
3. Intenta con descripción más clara

### Problema: Timeout o error 500

**Solución**:
1. Aumenta `maxOutputTokens` en configuración
2. Verifica conexión a internet
3. Revisa límites de API key de Gemini

---

## 📊 Métricas y Monitoreo

### Métricas Útiles
- **Tasa de éxito**: % de mensajes procesados correctamente
- **Tiempo promedio**: Latencia de respuestas
- **Confianza**: % de high/medium/low confidence
- **Errores**: Tipo y frecuencia

### Logs Informativos
```
[chatbot] Procesando mensaje: "Quiero agregar..."
[chatbotService.analyzeChatIntent] Clasificando: "Quiero agregar..."
[chatbotService.analyzeChatIntent] Respuesta: {"intent":"ADD_MEDICINE"}
[chatbotService.extractMedicationDetails] Extrayendo...
[chatbot] Medicamento creado: Paracetamol (id123)
```

---

## 🚀 Próximas Funcionalidades

### Corto Plazo
- ✅ Historial de conversación (ya implementado)
- ✅ Búsqueda de medicamentos (ya implementado)
- 🟡 Recomendaciones inteligentes (próximo)

### Mediano Plazo
- 🟡 Análisis de cumplimiento
- 🟡 Reportes automáticos
- 🟡 Integración con notificaciones push

### Largo Plazo
- 🟡 Análisis de efectividad
- 🟡 Predicción de patrones
- 🟡 API pública

---

## 📞 Contacto y Soporte

Para problemas o sugerencias:
1. Revisa los logs en `[chatbot*]`
2. Valida entrada con `validateMedicationDetails()`
3. Abre issue en repositorio

---

**Versión**: 2.0
**Última actualización**: 14 de Noviembre de 2025
**Estado**: ✅ Production Ready
