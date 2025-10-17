import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';
import { useState } from 'react';
import { useChatMessages } from './hooks/useChatMessages';
import { sendMessageToBackend, uploadFileToBackend, analyzeFinancialData } from '../../services/chatService';
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
    try {
      // Detectar si la pregunta es de análisis financiero y hay archivo subido
      const filename = window.lastUploadedFile || null;
      const tool = selectedTool || null;
      const isFinancialAnalysis = /ratio|an[aá]lisis|liquidez|financier[ao]/i.test(input) && filename;
      if (isFinancialAnalysis) {
        // Leer el archivo subido (Excel) y enviarlo al backend para análisis
        // Aquí deberías obtener los datos del archivo, pero como frontend no puede leer Excel directamente,
        // solo mandamos el nombre del archivo y el backend debe saber extraerlo.
        const data = { filename };
        const result = await analyzeFinancialData(data);
        const botMessage = { text: result.data ? JSON.stringify(result.data, null, 2) : result.message, isUser: false, id: Date.now() + 1 };
        addMessage(botMessage);
      } else {
        const data = await sendMessageToBackend(userMessage.text, filename, tool);
        const botMessage = { text: data.response, isUser: false, id: Date.now() + 1 };
        addMessage(botMessage);
      }
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = { text: 'Lo siento, hubo un error al procesar tu mensaje.', isUser: false, id: Date.now() + 1 };
      addMessage(errorMessage);
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

      const loadingMessage = {
        text: `Procesando "${file.name}"...`,
        isUser: false,
        isLoading: true,
        id: Date.now() + 1
      };
      addMessage(loadingMessage);
      setIsLoading(true);

      try {
        // Enviar archivo y herramienta seleccionada como metadata
        const data = await uploadFileToBackend(file, selectedTool);
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
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

        // Guardar el nombre del archivo subido en el estado para usarlo en preguntas posteriores
        window.lastUploadedFile = data.filename;

        // Si hay herramienta seleccionada y NO hay pregunta, preguntar al usuario qué desea hacer
        if (selectedTool && (!text || text.trim() === '')) {
          const askMessage = {
            text: `¿Qué deseas hacer con el archivo "${data.filename}" usando la herramienta "${selectedTool}"?`,
            isUser: false,
            id: Date.now() + 3
          };
          addMessage(askMessage);
        }

        // Si hay herramienta seleccionada y SÍ hay pregunta, enviar la pregunta al backend con contexto
        if (selectedTool && text && text.trim() !== '') {
          setIsLoading(true);
          try {
            // Enviar mensaje con filename y tool explícitos
            const response = await sendMessageToBackend(text.trim(), data.filename, selectedTool);
            const botMessage = { text: response.response, isUser: false, id: Date.now() + 4 };
            addMessage(botMessage);
            setSelectedTool(null);
          } catch (error) {
            console.error('Error al procesar la pregunta:', error);
            const errorMessage = { text: 'Lo siento, hubo un error al procesar tu solicitud.', isUser: false, id: Date.now() + 4 };
            addMessage(errorMessage);
          } finally {
            setIsLoading(false);
          }
        }

      } catch (error) {
        console.error('Error al subir archivo:', error);
        setMessages(prev => prev.map( msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: '❌ Error al procesar el archivo. Inténtalo de nuevo.', isLoading: false }
            : msg
        ));
      } finally {
        setIsLoading(false);
        if (clearFilesRef.current) {
          clearFilesRef.current();
        }
      }
    }
    if (text && text.trim() !== '') {
      await handleSend();
    }
  };

  return (
    <div className="chat-container">
      <Sidebar onToolSelect={setSelectedTool} />
      <main className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h1>Hola,</h1>
            <p>¿Cómo puedo ayudarte hoy?</p>
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