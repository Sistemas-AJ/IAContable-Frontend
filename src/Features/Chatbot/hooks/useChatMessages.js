import { useState, useRef } from 'react';

export function useChatMessages() {
  const [messages, setMessages] = useState([]);
  const clearFilesRef = useRef(null);

  // Agrega mensaje y mantiene solo los últimos 10
  const addMessage = (message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      return newMessages.length > 10 ? newMessages.slice(-10) : newMessages;
    });
  };

  // Permite setear función para limpiar archivos
  const setClearFiles = (fn) => {
    clearFilesRef.current = fn;
  };

  return {
    messages,
    setMessages,
    addMessage,
    clearFilesRef,
    setClearFiles
  };
}
