import {
    Bot,
    Clock,
    Mic,
    MicOff,
    Pill,
    Send,
    Settings,
    User
} from 'lucide-react-native';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Mensaje {
  id: string;
  texto: string;
  esUsuario: boolean;
  timestamp: Date;
}

export default function AsistenteScreen() {
  const [mensaje, setMensaje] = useState('');
  const [grabando, setGrabando] = useState(false);
  const [mensajes, setMensajes] = useState<Mensaje[]>([
    {
      id: '1',
      texto: '¡Hola! Soy su asistente personal de PastillApp. ¿En qué puedo ayudarle hoy?',
      esUsuario: false,
      timestamp: new Date(Date.now() - 5 * 60000)
    },
    {
      id: '2',
      texto: 'Hola, quiero cambiar la hora de mi medicamento',
      esUsuario: true,
      timestamp: new Date(Date.now() - 4 * 60000)
    },
    {
      id: '3',
      texto: 'Por supuesto. ¿Qué medicamento desea modificar y a qué hora le gustaría tomarlo?',
      esUsuario: false,
      timestamp: new Date(Date.now() - 3 * 60000)
    }
  ]);

  const enviarMensaje = () => {
    if (mensaje.trim()) {
      const nuevoMensaje: Mensaje = {
        id: Date.now().toString(),
        texto: mensaje.trim(),
        esUsuario: true,
        timestamp: new Date()
      };
      
      setMensajes(prev => [...prev, nuevoMensaje]);
      setMensaje('');
      
      // Simular respuesta del asistente
      setTimeout(() => {
        const respuesta: Mensaje = {
          id: (Date.now() + 1).toString(),
          texto: 'Entiendo. Permíteme ayudarte con eso. ¿Podrías ser más específico sobre lo que necesitas?',
          esUsuario: false,
          timestamp: new Date()
        };
        setMensajes(prev => [...prev, respuesta]);
      }, 1000);
    }
  };

  const toggleGrabacion = () => {
    setGrabando(!grabando);
    // Aquí iría la lógica de grabación de voz
  };

  const formatHora = (date: Date) => {
    return date.toLocaleTimeString('es-ES', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.botIcon}>
            <Bot size={28} color="#2563EB" strokeWidth={2} />
          </View>
          <View>
            <Text style={styles.title}>Asistente IA</Text>
            <Text style={styles.subtitle}>Siempre aquí para ayudarte</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.settingsButton}>
          <Settings size={24} color="#6B7280" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Acciones rápidas */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.quickActionButton}>
          <Clock size={24} color="#2563EB" strokeWidth={2} />
          <Text style={styles.quickActionText}>Cambiar horario</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.quickActionButton}>
          <Pill size={24} color="#16A34A" strokeWidth={2} />
          <Text style={styles.quickActionText}>Añadir medicamento</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {mensajes.map((msg) => (
            <View 
              key={msg.id} 
              style={[
                styles.messageWrapper,
                msg.esUsuario ? styles.userMessageWrapper : styles.botMessageWrapper
              ]}
            >
              <View style={[
                styles.message,
                msg.esUsuario ? styles.userMessage : styles.botMessage
              ]}>
                <View style={styles.messageHeader}>
                  {msg.esUsuario ? (
                    <User size={20} color="#FFFFFF" strokeWidth={2} />
                  ) : (
                    <Bot size={20} color="#2563EB" strokeWidth={2} />
                  )}
                  <Text style={[
                    styles.messageTime,
                    msg.esUsuario ? styles.userMessageTime : styles.botMessageTime
                  ]}>
                    {formatHora(msg.timestamp)}
                  </Text>
                </View>
                <Text style={[
                  styles.messageText,
                  msg.esUsuario ? styles.userMessageText : styles.botMessageText
                ]}>
                  {msg.texto}
                </Text>
              </View>
            </View>
          ))}
        </ScrollView>

        {/* Input de mensaje */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.textInput}
              value={mensaje}
              onChangeText={setMensaje}
              placeholder="Escriba su mensaje aquí..."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              maxLength={500}
            />
            
            <View style={styles.inputActions}>
              <TouchableOpacity 
                style={[
                  styles.voiceButton,
                  grabando && styles.voiceButtonActive
                ]}
                onPress={toggleGrabacion}
              >
                {grabando ? (
                  <MicOff size={24} color="#FFFFFF" strokeWidth={2} />
                ) : (
                  <Mic size={24} color="#6B7280" strokeWidth={2} />
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.sendButton}
                onPress={enviarMensaje}
                disabled={!mensaje.trim()}
              >
                <Send size={24} color="#FFFFFF" strokeWidth={2} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  botIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  settingsButton: {
    padding: 8,
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  quickActionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  chatContainer: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  messageWrapper: {
    marginBottom: 16,
  },
  userMessageWrapper: {
    alignItems: 'flex-end',
  },
  botMessageWrapper: {
    alignItems: 'flex-start',
  },
  message: {
    maxWidth: '85%',
    padding: 16,
    borderRadius: 16,
  },
  userMessage: {
    backgroundColor: '#2563EB',
    borderBottomRightRadius: 4,
  },
  botMessage: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  messageTime: {
    fontSize: 12,
    fontWeight: '500',
  },
  userMessageTime: {
    color: '#BFDBFE',
  },
  botMessageTime: {
    color: '#9CA3AF',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userMessageText: {
    color: '#FFFFFF',
  },
  botMessageText: {
    color: '#374151',
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
    maxHeight: 100,
  },
  inputActions: {
    flexDirection: 'row',
    gap: 8,
  },
  voiceButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  voiceButtonActive: {
    backgroundColor: '#DC2626',
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
});