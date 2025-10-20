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

  // Enviar mensaje al backend
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

  // Subir archivos solo cuando se presiona enviar
  const handleSendFiles = async (files, text) => {
    if (!files || files.length === 0) return;
    for (const file of files) {
      const fileMessage = {
        text: `Archivo subido: ${file.name}`,
        isUser: true,
        id: Date.now(),
        file: file
      };
      addMessage(fileMessage);

      // Usar un id único basado en el nombre del archivo para evitar duplicados
      const loadingMessageId = `loading-${file.name}`;
      // Antes de agregar, eliminar cualquier mensaje de carga previo para este archivo
      setMessages(prev => prev.filter(msg => msg.id !== loadingMessageId));
      const loadingMessage = {
        text: `Procesando "${file.name}"...`,
        isUser: false,
        isLoading: true,
        id: loadingMessageId
      };
      addMessage(loadingMessage);
      setIsLoading(true);

      try {
        // Enviar archivo y herramienta seleccionada como metadata
        const data = await uploadSessionFileToBackend(file, selectedTool);
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessageId
            ? {
                ...msg,
                text:
                  selectedTool
                    ? `✅ Archivo "${data.filename}" procesado exitosamente. El archivo será evaluado para análisis de ${selectedTool.toLowerCase()}.`
                    : `✅ Archivo "${data.filename}" procesado exitosamente. Ahora puedes preguntarme sobre su contenido.`,
                isLoading: false
              }
            : msg
        ));

        // Guardar el nombre del archivo subido y el session_id en el estado para usarlo en preguntas posteriores
        window.lastUploadedFile = data.filename;
        window.lastSessionId = data.session_id;

        // Si hay herramienta seleccionada y SÍ hay pregunta, enviar la pregunta al backend con archivo y herramienta juntos
        if (selectedTool && text && text.trim() !== '') {
          setIsLoading(true);
          try {
            // Enviar mensaje con filename y tool explícitos
            const response = await sendMessageToBackend(text.trim(), data.filename, selectedTool, data.session_id);
            // Agregar el mensaje del usuario (la pregunta) al historial SOLO cuando realmente se envía
            const userQuestionMessage = { text: text.trim(), isUser: true, id: Date.now() + 3 };
            addMessage(userQuestionMessage);
            // Agregar la respuesta del bot
            const botMessage = { text: response.response, isUser: false, id: Date.now() + 4 };
            addMessage(botMessage);
            setSelectedTool(null);
            setInput(''); // Limpiar input después de enviar todo junto
            if (clearFilesRef.current) {
              clearFilesRef.current(); // Limpiar archivos adjuntos
            }
          } catch (error) {
            console.error('Error al procesar la pregunta:', error);
            const errorMessage = { text: 'Lo siento, hubo un error al procesar tu solicitud.', isUser: false, id: Date.now() + 4 };
            addMessage(errorMessage);
          } finally {
            setIsLoading(false);
          }
        } else if (selectedTool && (!text || text.trim() === '')) {
          // Si hay herramienta seleccionada y NO hay pregunta, preguntar al usuario qué desea hacer
          const askMessage = {
            text: `¿Qué deseas hacer con el archivo "${data.filename}" usando la herramienta "${selectedTool}"?`,
            isUser: false,
            id: Date.now() + 3
          };
          addMessage(askMessage);
        }

      } catch (error) {
        console.error('Error al subir archivo:', error);
        setMessages(prev => prev.map( msg =>
          msg.id === loadingMessageId
            ? { ...msg, text: `❌ Error al procesar el archivo: ${error.message || 'Inténtalo de nuevo.'}`, isLoading: false }
            : msg
        ));
      } finally {
        setIsLoading(false);
        if (clearFilesRef.current) {
          clearFilesRef.current();
        }
      }
    }
    // No llamar a handleSend aquí, ya que el envío de la pregunta se maneja arriba si corresponde
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
          onSend={handleSend}
          onFileChange={handleFileChange}
          onSendFiles={handleSendFiles}
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