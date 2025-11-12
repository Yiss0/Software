// frontend/app/tabs/asistente.tsx (VERSIÓN FINAL, BORDE AÑADIDO AL BOT)

import React, { useState, useCallback, useEffect } from 'react';
import { 
  GiftedChat, 
  IMessage, 
  Bubble, 
  InputToolbar,
  Send,
  Composer
} from 'react-native-gifted-chat'; 
import { useAuth } from '../../context/AuthContext';
import { sendMessageToChatbot } from '../../services/apiService';
import { ActivityIndicator, View, StyleSheet, Text, Platform } from 'react-native'; 
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Send as SendIcon } from 'lucide-react-native'; 

interface ChatUser {
  _id: string | number;
  name?: string;
  avatar?: string;
}

const BOT_USER: ChatUser = {
  _id: 2,
  name: 'Pastillin',
  avatar: 'https://i.imgur.com/7k12EPD.png' 
};

const TAB_BAR_HEIGHT = 60; 

export default function AsistenteScreen() {
  const { user } = useAuth(); 
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // ... (useEffect, onSend, onQuickReply se mantienen exactamente iguales) ...
  useEffect(() => {
    if (user) {
      setMessages([
        {
          _id: 1,
          text: `¡Hola ${user.firstName}! Soy Pastillin, tu asistente personal. ¿En qué puedo ayudarte?`,
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
    setMessages(previousMessages => GiftedChat.append(previousMessages, [userMessage]));
    setIsBotTyping(true);
    if (!user?.id) return;
    try {
      const response = await sendMessageToChatbot(userMessage.text, user.id);
      const botMessage: IMessage = {
        _id: Math.random().toString(36), // Usar un ID más único
        text: response.response,
        createdAt: new Date(),
        user: BOT_USER,
      };
      setIsBotTyping(false);
      setMessages(previousMessages => GiftedChat.append(previousMessages, [botMessage]));
    } catch (error) {
      setIsBotTyping(false);
      console.error("Error al enviar mensaje al chatbot:", error);
    }
  }, [user]);

  const onQuickReply = (replies: any) => {
    if (!user) return; 
    const userMessage: IMessage = {
      _id: Math.random().toString(36), // Usar un ID más único
      text: replies[0].value,
      createdAt: new Date(),
      user: { _id: user.id },
    };
    onSend([userMessage]);
  };
  
  // --- MEJORA DE UI: Burbujas de Chat ---
  const renderBubble = (props: any) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { 
          backgroundColor: '#2563EB' 
        },
        left: { 
          backgroundColor: '#FFFFFF',
          // --- ¡CORRECCIÓN AÑADIDA! ---
          borderColor: '#E5E7EB', // Borde gris sutil
          borderWidth: 1,            // Grosor del borde
          // ---------------------------
        }, 
      }}
      textStyle={{
        right: { color: '#FFFFFF' }, 
        left: { color: '#1F2937' }
      }}
    />
  );

  // ... (renderSend, renderInputToolbar, renderComposer se mantienen iguales) ...
  const renderSend = (props: any) => (
    <Send {...props} containerStyle={styles.sendContainer}>
      <SendIcon size={24} color="#2563EB" />
    </Send>
  );

  const renderInputToolbar = (props: any) => (
    <InputToolbar
      {...props}
      containerStyle={styles.inputToolbarContainer}
      primaryStyle={styles.inputToolbarPrimary}
    />
  );
  
  const renderComposer = (props: any) => (
    <Composer
      {...props}
      textInputStyle={styles.composer} 
    />
  );

  // Estado de carga
  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Asistente Pastillin</Text>
      </View>
      
      <View style={styles.chatWrapper}>
        <GiftedChat
          messages={messages}
          onSend={messages => onSend(messages)}
          onQuickReply={onQuickReply}
          user={{ _id: user.id }}
          placeholder="Escribe tu mensaje aquí..."
          isTyping={isBotTyping}
          
          messagesContainerStyle={styles.chatContainer}
          bottomOffset={TAB_BAR_HEIGHT} 
          
          renderBubble={renderBubble}
          renderInputToolbar={renderInputToolbar}
          renderSend={renderSend}
          renderComposer={renderComposer} 
          quickReplyStyle={styles.quickReply}
          quickReplyTextStyle={styles.quickReplyText}
          alwaysShowSend={true} 
          renderAvatar={() => null} 
        />
      </View>

    </SafeAreaView>
  );
}

// ... (Los estilos 'styles' se mantienen exactamente iguales) ...
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  header: { 
    paddingHorizontal: 20, 
    paddingVertical: 20,
    backgroundColor: '#F8FAFC'
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#1F2937' 
  },
  loadingContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#F8FAFC'
  },
  chatWrapper: {
    flex: 1,
  },
  chatContainer: {
    backgroundColor: '#F8FAFC',
    paddingBottom: 20 
  },
  inputToolbarContainer: {
    backgroundColor: '#FFFFFF',
    borderTopColor: '#E5E7EB',
    borderTopWidth: 1,
    paddingHorizontal: 8, 
    paddingVertical: 8, 
  },
  inputToolbarPrimary: {
    alignItems: 'center', 
  },
  composer: {
    flex: 1,
    backgroundColor: '#F3F4F6', 
    borderRadius: 20,          
    paddingHorizontal: 16,     
    paddingVertical: Platform.OS === 'ios' ? 10 : 8, 
    marginLeft: 0,             
    fontSize: 16,
    lineHeight: 22,
    color: '#1F2937',          
  },
  sendContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%'
  },
  quickReply: {
    borderRadius: 20,
    backgroundColor: '#EBF4FF', 
    borderColor: '#2563EB', 
    borderWidth: 1,
    padding: 10,
    marginVertical: 4,
  },
  quickReplyText: {
    color: '#1E40AF', 
    fontWeight: '600',
  },
});