import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';
import { useState } from 'react';
import { useChatMessages } from './hooks/useChatMessages';
import { sendMessageToBackend, uploadSessionFileToBackend } from '../../services/chatService';
import ChatMessages from './components/ChatMessages';
import { FaCheck } from "react-icons/fa";

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const handleRemoveTool = () => setSelectedTool(null);

  // Custom hook para mensajes y referencia de archivos
  const {
    messages,
    setMessages,
    addMessage,
    clearFilesRef,
    setClearFiles
  } = useChatMessages();

  // Enviar mensaje (solo texto) al backend
  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;
    const userMessage = { text: input, isUser: true, id: Date.now() };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);
    let botMsgId = Date.now() + 1;
    let lastBotMessage = { text: '', isUser: false, id: botMsgId };
    addMessage(lastBotMessage);
    try {
      const filename = window.lastUploadedFile || null;
      const tool = selectedTool || null;
      const session_id = window.lastSessionId || null;
      
      // Callback para mostrar respuesta en tiempo real
      const onProgress = (partial) => {
        setMessages(prev => prev.map(msg =>
          msg.id === botMsgId ? { ...msg, text: partial } : msg
        ));
      };

      if (filename && tool && session_id) {
        await sendMessageToBackend(userMessage.text, filename, tool, session_id, onProgress);
        setSelectedTool(null);
      } else if (filename && session_id) {
        await sendMessageToBackend(userMessage.text, filename, null, session_id, onProgress);
      } else {
        await sendMessageToBackend(userMessage.text, null, tool, null, onProgress);
        setSelectedTool(null);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === botMsgId ? { ...msg, text: 'Lo siento, hubo un error al procesar tu mensaje.' } : msg
      ));
    } finally {
      setIsLoading(false);
    }
  };

  // Ya no subimos archivos automáticamente al seleccionar
  const handleFileChange = (e) => {
    // Solo actualiza el input, no sube archivos
  };

  // --- ESTA ES LA FUNCIÓN CORREGIDA ---
  // Subir archivos y manejar la pregunta adjunta
  const handleSendFiles = async (files, text) => {
    if (!files || files.length === 0) return;

    // 1. Capturamos la pregunta y limpiamos la UI inmediatamente
    const question = text.trim();
    setInput(''); // Limpiar el <textarea>
    if (clearFilesRef.current) {
      clearFilesRef.current(); // Limpiar la vista previa de archivos en ChatInput
    }

    for (const file of files) {
      const fileMessage = {
        text: question
          ? `Archivo subido: ${file.name}
           + pregunta: "${question}"`
          : `Archivo subido: ${file.name}`,
        isUser: true,
        id: Date.now(),
        file: file,
        question: question || undefined
      };
      addMessage(fileMessage);

      // ID único para el mensaje de carga
      const botMsgId = `loading-${file.name}-${Date.now()}`;
      addMessage({
        text: '',
        isUser: false,
        isLoading: true,
        id: botMsgId
      });
      setIsLoading(true);

      try {
        // 2. Subir archivo y obtener filename/session_id
        const response = await uploadSessionFileToBackend(file, selectedTool);

        // --- VALIDACIÓN Y PARSEO ---
        let data;
        try {
          if (!response || !response.message) {
            console.error("Respuesta del backend no tiene la clave 'message':", response);
            throw new Error("Formato de respuesta inesperado del servidor.");
          }
          data = JSON.parse(response.message);
        } catch (e) {
          console.error("Error al parsear la respuesta del backend:", response.message, e);
          throw new Error("Error de formato en la respuesta del servidor.");
        }

        if (!data || !data.filename || !data.session_id) {
          console.error("Respuesta inesperada del backend (después de parsear):", data);
          throw new Error("El servidor no devolvió la información del archivo procesado.");
        }

        const processedFilename = data.filename;
        const sessionId = data.session_id;

        // Guardar datos del último archivo para futuras preguntas
        window.lastUploadedFile = processedFilename;
        window.lastSessionId = sessionId;

        // 3. Si hay pregunta, enviar archivo + pregunta juntos al backend
        if (question) {
          // Callback para mostrar respuesta en tiempo real
          const onProgress = (partial) => {
            setMessages(prev => prev.map(msg =>
              msg.id === botMsgId ? { ...msg, text: partial, isLoading: false } : msg
            ));
          };

          // Enviar mensaje al backend con archivo, pregunta y herramienta
          await sendMessageToBackend(question, processedFilename, selectedTool, sessionId, onProgress);
          setSelectedTool(null);
        } else {
          // Si no hay pregunta, solo mostrar éxito
          setMessages(prev => prev.map(msg =>
            msg.id === botMsgId
              ? {
                  ...msg,
                  text: '',
                  isLoading: false,
                  customSuccess: {
                    processedFilename,
                    selectedTool
                  }
                }
              : msg
          ));
          if (selectedTool) setSelectedTool(null);
        }
        setIsLoading(false);

      } catch (error) {
        // Error durante la SUBIDA del archivo o envío
        console.error('Error al subir archivo o enviar mensaje:', error);
        setMessages(prev => prev.map( msg =>
          msg.id === botMsgId
            ? { ...msg, text: ` Error al procesar el archivo: ${error.message || 'Inténtalo de nuevo.'}`, isLoading: false }
            : msg
        ));
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="chat-container">
      <Sidebar onToolSelect={setSelectedTool} />
      <main className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h1>Hola,</h1>
            <p>¿En qué puedo ayudarte hoy?</p>
          </div>
        ) : (
          <ChatMessages
            messages={messages}
            isLoading={isLoading}
            renderCustomSuccess={(msg) => (
              <div className="bot-message" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaCheck style={{ color: '#27ae60', fontSize: 18 }} />
                {msg.customSuccess.selectedTool
                  ? `Archivo "${msg.customSuccess.processedFilename}" procesado. Se usará la herramienta ${msg.customSuccess.selectedTool.toLowerCase()}.`
                  : `Archivo "${msg.customSuccess.processedFilename}" procesado. Ahora puedes preguntarme sobre él.`}
              </div>
            )}
          />
        )}
        <ChatInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onSend={handleSend} // Para enviar solo texto
          onFileChange={handleFileChange}
          onSendFiles={handleSendFiles} // Para enviar archivos (con o sin texto)
          onClearFiles={setClearFiles}
          disabled={isLoading}
          selectedTool={selectedTool}
          onRemoveTool={handleRemoveTool}
        />
      </main>
    </div>
  );
};

export default Chatbot;