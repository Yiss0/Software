import React, { useState, useCallback, useEffect } from 'react';
import { GiftedChat, IMessage, QuickReplies } from 'react-native-gifted-chat';
import { useAuth } from '../../context/AuthContext';
import { sendMessageToChatbot } from '../../services/apiService';

// Definimos un tipo para los usuarios del chat (nosotros y el bot)
interface ChatUser {
  _id: string | number;
  name?: string;
  avatar?: string;
}

// Creamos un objeto para representar al bot en el chat
const BOT_USER: ChatUser = {
  _id: 2,
  name: 'Pasti',
  // Puedes usar un logo local o una URL para el avatar del bot
  avatar: 'https://i.imgur.com/7k12EPD.png' 
};

export default function AsistenteScreen() {
  const { user } = useAuth(); // Obtenemos el perfil del usuario logueado
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Este efecto se ejecuta una sola vez para mostrar el mensaje de bienvenida
  useEffect(() => {
    setMessages([
      {
        _id: 1,
        text: `¡Hola ${user?.firstName}! Soy Pasti, tu asistente personal. ¿En qué puedo ayudarte?`,
        createdAt: new Date(),
        user: BOT_USER,
        // ¡Aquí añadimos los botones de acción rápida para que coincida con tu diseño!
        quickReplies: {
          type: 'radio', // 'radio' para que solo se pueda presionar uno
          values: [
            { title: '💊 Añadir medicamento', value: 'Añadir medicamento' },
            { title: '🕓 Cambiar horario', value: 'Quiero cambiar el horario de un medicamento' },
          ],
        },
      },
    ]);
  }, [user]);

  // Esta función se activa cuando el usuario envía un mensaje
  const onSend = useCallback(async (newMessages: IMessage[] = []) => {
    const userMessage = newMessages[0];
    
    // 1. Añade el mensaje del usuario a la pantalla al instante
    setMessages(previousMessages =>
      GiftedChat.append(previousMessages, [userMessage]) 
    );
    setIsBotTyping(true); // Muestra "Pasti está escribiendo..."

    // 2. Envía el mensaje del usuario al backend
    if (!user?.id) return;
    try {
      const response = await sendMessageToChatbot(userMessage.text, user.id);
      
      // 3. Crea el mensaje de respuesta del bot con los datos del backend
      const botMessage: IMessage = {
        _id: Math.random().toString(36).substring(7),
        text: response.response,
        createdAt: new Date(),
        user: BOT_USER,
      };

      // 4. Añade la respuesta del bot a la pantalla
      setIsBotTyping(false); // Oculta "Pasti está escribiendo..."
      setMessages(previousMessages =>
        GiftedChat.append(previousMessages, [botMessage])
      );
    } catch (error) {
      setIsBotTyping(false);
      console.error("Error al enviar mensaje al chatbot:", error);
    }
  }, [user]);

  // Esta función se activa cuando el usuario presiona un botón de acción rápida
  const onQuickReply = (replies: any) => {
    const userMessage: IMessage = {
      _id: Math.random().toString(36).substring(7),
      text: replies[0].value,
      createdAt: new Date(),
      user: { _id: user?.id || 1 },
    };
    onSend([userMessage]);
  };

  // Renderizamos el componente de chat
  return (
    <GiftedChat
      messages={messages}
      onSend={messages => onSend(messages)}
      onQuickReply={onQuickReply}
      user={{
        _id: user?.id || 1, // El ID del usuario actual
      }}
      placeholder="Escribe tu mensaje aquí..."
      isTyping={isBotTyping} // Para el indicador de "escribiendo..."
      messagesContainerStyle={{ backgroundColor: '#F8FAFC' }}
    />
  );
}