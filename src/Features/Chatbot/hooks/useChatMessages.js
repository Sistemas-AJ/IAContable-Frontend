import { useState, useRef } from "react";

export function useChatMessages() {
  const [messages, setMessages] = useState([]);
  const clearFilesRef = useRef(null);

  // Agrega mensaje y mantiene el historial completo
  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
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
    setClearFiles,
  };
}
