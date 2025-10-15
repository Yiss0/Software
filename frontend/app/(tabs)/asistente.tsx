import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import { sendMessageToChatbot } from '../../services/apiService';
import { ActivityIndicator, View } from 'react-native';

interface ChatUser {
  _id: string | number;
  name?: string;
  avatar?: string;
}

const BOT_USER: ChatUser = {
  _id: 2,
  name: 'Pasti',
  avatar: 'https://i.imgur.com/7k12EPD.png' 
};

export default function AsistenteScreen() {
  const { user } = useAuth(); 
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  useEffect(() => {
    // Este efecto ahora solo se ejecutará cuando 'user' sea válido
    if (user) {
      setMessages([
        {
          _id: 1,
          text: `¡Hola ${user.firstName}! Soy Pasti, tu asistente personal. ¿En qué puedo ayudarte?`,
          createdAt: new Date(),
          user: BOT_USER,
          quickReplies: {
            type: 'radio',
            values: [
              { title: '💊 Añadir medicamento', value: 'Añadir medicamento' },
              { title: '🕓 Cambiar horario', value: 'Quiero cambiar el horario de un medicamento' },
            ],
          },
        },
      ]);
    }
  }, [user]);

  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [userMessage]) 
    );
    setIsBotTyping(true);

    if (!user?.id) return;
    try {
      const response = await sendMessageToChatbot(userMessage.text, user.id);
      
      const botMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: response.response,
        createdAt: new Date(),
        user: BOT_USER,
      };

      setIsBotTyping(false);
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    } catch (error) {
      setIsBotTyping(false);
      console.error("Error al enviar mensaje al chatbot:", error);
    }
  }, [user]);

  const onQuickReply = (replies: any) => {
    if (!user) return; // Añadimos una guarda de seguridad
    const userMessage: IMessage = {
      _id: Math.random().toString(36).substring(7),
      text: replies[0].value,
      createdAt: new Date(),
      user: { _id: user.id },
    };
    onSend([userMessage]);
  };

  // --- ¡LA SOLUCIÓN CLAVE ESTÁ AQUÍ! ---
  // Si todavía no tenemos la información del usuario, mostramos un indicador de carga.
  if (!user) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  // Solo renderizamos el chat cuando estamos seguros de que 'user' existe.
  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      onQuickReply={onQuickReply}
      user={{
        _id: user.id, // Ahora podemos usar user.id de forma segura
      }}
      placeholder="Escribe tu mensaje aquí..."
      isTyping={isBotTyping}
      messagesContainerStyle={{ backgroundColor: '#F8FAFC' }}
    />
  );
}