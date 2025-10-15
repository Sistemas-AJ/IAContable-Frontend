import React, { useState } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [clearFiles, setClearFiles] = useState(null);
  // Función para agregar mensaje manteniendo solo los últimos 10
  const addMessage = (message) => {
    setMessages(prev => {
      const newMessages = [...prev, message];
      // Mantener solo los últimos 10 mensajes
      return newMessages.length > 10 ? newMessages.slice(-10) : newMessages;
    });
  };

  // Función para enviar mensaje al backend
  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { text: input, isUser: true, id: Date.now() };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('http://127.0.0.1:9000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userMessage.text }),
      });

      if (!response.ok) {
        throw new Error('Error en la respuesta del servidor');
      }

      const data = await response.json();
      const botMessage = { text: data.response, isUser: false, id: Date.now() + 1 };
      addMessage(botMessage);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = { text: 'Lo siento, hubo un error al procesar tu mensaje.', isUser: false, id: Date.now() + 1 };
      addMessage(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Manejar archivo subido
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Mostrar mensaje del usuario con el archivo
      const fileMessage = {
        text: `Archivo subido: ${file.name}`,
        isUser: true,
        id: Date.now(),
        file: file
      };
      addMessage(fileMessage);

      // Mostrar mensaje de carga del sistema
      const loadingMessage = {
        text: `Procesando "${file.name}"...`,
        isUser: false,
        isLoading: true,
        id: Date.now() + 1
      };
      addMessage(loadingMessage);
      setIsLoading(true);

      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://127.0.0.1:9000/upload-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir el archivo');
        }

        const data = await response.json();

        // Reemplazar mensaje de carga con mensaje de éxito
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: `✅ Archivo "${data.filename}" procesado exitosamente. Ahora puedes preguntarme sobre su contenido.`, isLoading: false }
            : msg
        ));

      } catch (error) {
        console.error('Error al subir archivo:', error);
        // Reemplazar mensaje de carga con mensaje de error
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: '❌ Error al procesar el archivo. Inténtalo de nuevo.', isLoading: false }
            : msg
        ));
      } finally {
        setIsLoading(false);
        // Limpiar los archivos de la barra de entrada después del procesamiento
        if (clearFiles) {
          clearFiles();
        }
      }
    }
  };

  return (
    <div className="chat-container">
      <Sidebar />
      <main className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h1>Hola,</h1>
            <p>¿Cómo puedo ayudarte hoy?</p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg) => (
              <div key={msg.id || msg.text} className={`message ${msg.isUser ? 'user' : 'bot'} ${msg.isLoading ? 'loading' : ''}`}>
                {msg.isLoading ? (
                  <div className="loading-indicator">
                    <div className="loading-dots">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                    {msg.text}
                  </div>
                ) : (
                  msg.text
                )}
              </div>
            ))}
            {isLoading && (
              <div className="message bot loading">
                <div className="loading-indicator">
                  <div className="loading-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                  Pensando...
                </div>
              </div>
            )}
          </div>
        )}
        <ChatInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onSend={handleSend}
          onFileChange={handleFileChange}
          onClearFiles={setClearFiles}
          disabled={isLoading}
        />
      </main>
    </div>
  );
};

export default Chatbot;