import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';
import { useState } from 'react';
import { useChatMessages } from './hooks/useChatMessages';
import { sendMessageToBackend, uploadSessionFileToBackend } from '../../services/chatService';
import ChatMessages from './components/ChatMessages';

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
        text: `Archivo subido: ${file.name}`,
        isUser: true,
        id: Date.now(),
        file: file
      };
      addMessage(fileMessage);

      // ID único para el mensaje de carga
      const loadingMessageId = `loading-${file.name}-${Date.now()}`;
      addMessage({
        text: `Procesando "${file.name}"...`,
        isUser: false,
        isLoading: true,
        id: loadingMessageId
      });
      setIsLoading(true);

      try {
        // 2. Enviar archivo y herramienta (si existe)
        const response = await uploadSessionFileToBackend(file, selectedTool);

        // --- FIX 1: VALIDACIÓN Y PARSEO (NUEVO) ---
        // El backend está devolviendo un JSON dentro de un string en la clave "message"
        let data;
        try {
          // Primero, verificamos si 'response' y 'response.message' existen
          if (!response || !response.message) {
             console.error("Respuesta del backend no tiene la clave 'message':", response);
             throw new Error("Formato de respuesta inesperado del servidor.");
          }
          
          // Parseamos el string JSON que está en 'response.message'
          data = JSON.parse(response.message);

        } catch (e) {
          console.error("Error al parsear la respuesta del backend:", response.message, e);
          throw new Error("Error de formato en la respuesta del servidor.");
        }

        // Ahora validamos el 'data' parseado
        if (!data || !data.filename || !data.session_id) {
          console.error("Respuesta inesperada del backend (después de parsear):", data);
          throw new Error("El servidor no devolvió la información del archivo procesado.");
        }

        const processedFilename = data.filename;
        const sessionId = data.session_id;

        // 3. Mostrar mensaje de éxito
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                text:
                  selectedTool
                    ? `✅ Archivo "${processedFilename}" procesado. Se usará la herramienta ${selectedTool.toLowerCase()}.`
                    : `✅ Archivo "${processedFilename}" procesado. Ahora puedes preguntarme sobre él.`,
                isLoading: false
              }
            : msg
        ));

        // Guardar datos del último archivo para futuras preguntas
        window.lastUploadedFile = processedFilename;
        window.lastSessionId = sessionId;

        // --- FIX 2: LÓGICA DE ENVÍO DE PREGUNTA ---
        
        if (question) {
          // 4. Si hay pregunta, la enviamos automáticamente
          
          const userQuestionMessage = { text: question, isUser: true, id: Date.now() + 1 };
          addMessage(userQuestionMessage);
          
          const botMsgId = Date.now() + 2;
          addMessage({ text: '', isUser: false, id: botMsgId });
          
          setIsLoading(true); // Aseguramos que siga cargando mientras responde

          try {
            // Callback para streaming (onProgress)
            const onProgress = (partial) => {
              setMessages(prev => prev.map(msg =>
                msg.id === botMsgId ? { ...msg, text: partial } : msg
              ));
            };

            // Enviar la pregunta
            await sendMessageToBackend(question, processedFilename, selectedTool, sessionId, onProgress);
            
            setSelectedTool(null); // Limpiar la herramienta

          } catch (error) {
            console.error('Error al procesar la pregunta:', error);
            setMessages(prev => prev.map(msg =>
              msg.id === botMsgId ? { ...msg, text: 'Lo siento, hubo un error al procesar tu pregunta.' } : msg
            ));
          } finally {
            setIsLoading(false); // Terminar carga (pregunta)
          }

        } else if (selectedTool) {
          // 5. Si NO hay pregunta, PERO SÍ hay herramienta
          const askMessage = {
            text: `¿Qué deseas hacer con el archivo "${processedFilename}" usando la herramienta "${selectedTool}"?`,
            isUser: false,
            id: Date.now() + 3
          };
          addMessage(askMessage);
          setIsLoading(false); // Terminar carga (solo subida)
        } else {
          // 6. Si NO hay pregunta NI herramienta
          setIsLoading(false);
        }

      } catch (error) {
        // Error durante la SUBIDA del archivo
        console.error('Error al subir archivo:', error);
        setMessages(prev => prev.map( msg =>
          msg.id === loadingMessageId
            ? { ...msg, text: `❌ Error al procesar el archivo: ${error.message || 'Inténtalo de nuevo.'}`, isLoading: false }
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
          <ChatMessages messages={messages} isLoading={isLoading} />
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