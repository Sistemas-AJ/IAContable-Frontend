import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';
import { useState } from 'react';
import { useChatMessages } from './hooks/useChatMessages';
import { sendMessageToBackend, uploadFileToBackend, analyzeFinancialData } from '../../services/chatService';
import ChatMessages from './components/ChatMessages';
import { FiCheckCircle } from 'react-icons/fi';

const Chatbot = () => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState('');
  const [showSessionCheck, setShowSessionCheck] = useState(false);
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

  // --- handleSend (streaming) ---
  const handleSend = async () => {
    if (input.trim() === '' || isLoading) return;

    const userMessage = { text: input, isUser: true, id: Date.now() };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const filename = window.lastUploadedFile || null;
      const tool = selectedTool || null;
      const isFinancialAnalysis = /ratio|analisis|an\\u00e1lisis|liquidez|financiero|financiera/i.test(input) && filename;

      if (isFinancialAnalysis) {
        const data = { filename };
        const result = await analyzeFinancialData(data, sessionId);
        const botMessage = { text: result.data ? JSON.stringify(result.data, null, 2) : result.message, isUser: false, id: Date.now() + 1 };
        addMessage(botMessage);
        setIsLoading(false);
      } else {
        // Streaming
        const botMessageId = Date.now() + 1;
        const botMessage = { text: '', isUser: false, id: botMessageId };
        addMessage(botMessage);

        await sendMessageToBackend(
          userMessage.text,
          sessionId,
          filename,
          tool,
          // onMessage
          (chunk) => {
            typewriterAppend(botMessageId, chunk);
          },
          // onError
          (errorText) => {
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, text: `Lo siento, hubo un error: ${errorText}` }
                  : msg
              )
            );
          },
          // onEnd
          () => {
            setIsLoading(false);
            setSelectedTool(null);
          },
          // onSessionId
          (newSessionId) => {
            if (!sessionId) {
              setSessionId(newSessionId);
              setShowSessionCheck(true);
              setTimeout(() => setShowSessionCheck(false), 2600);
            } else if (sessionId !== newSessionId) {
              setSessionId(newSessionId);
            }
          }
        );
      }
    } catch (error) {
      const errorMessage = { text: 'Lo siento, hubo un error al procesar tu mensaje.', isUser: false, id: Date.now() + 1 };
      addMessage(errorMessage);
      setIsLoading(false);
    }
  };

  // Subir archivos solo cuando se presiona enviar
  const handleSendFiles = async (files, text) => {
    if (!files || files.length === 0) return;
    for (const file of files) {
      const fileMessage = {
        text: `Archivo subido: ${file.name}`,
        isUser: true,
        id: Date.now(),
        file
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
        const data = await uploadFileToBackend(file, selectedTool, sessionId);
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? {
                ...msg,
                text:
                  selectedTool
                    ? `✔ Archivo "${data.filename}" procesado exitosamente. El archivo será evaluado para análisis de ${selectedTool.toLowerCase()}.`
                    : `✔ Archivo "${data.filename}" procesado exitosamente. Ahora puedes preguntarme sobre su contenido.`,
                isLoading: false
              }
            : msg
        ));

        window.lastUploadedFile = data.filename;

        if (selectedTool && (!text || text.trim() === '')) {
          const askMessage = {
            text: `¿Qué deseas hacer con el archivo "${data.filename}" usando la herramienta "${selectedTool}"?`,
            isUser: false,
            id: Date.now() + 3
          };
          addMessage(askMessage);
        }

        if (selectedTool && text && text.trim() !== '') {
          setInput(text);
          setTimeout(() => {
            handleSend();
          }, 0);

          if (clearFilesRef.current) {
            clearFilesRef.current();
          }
        }

      } catch (error) {
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: 'Error al procesar el archivo. Inténtalo de nuevo.', isLoading: false }
            : msg
        ));
      } finally {
        setIsLoading(false);
        if ((!text || text.trim() === '') && clearFilesRef.current) {
          clearFilesRef.current();
        }
      }
    }
  };

  // Helpers
  const typewriterAppend = (botMessageId, chunk) => {
    const chars = chunk.split('');
    let index = 0;
    const interval = setInterval(() => {
      const char = chars[index];
      setMessages(prev =>
        prev.map(msg =>
          msg.id === botMessageId
            ? { ...msg, text: msg.text + char }
            : msg
        )
      );
      index += 1;
      if (index >= chars.length) {
        clearInterval(interval);
      }
    }, 10);
  };

  return (
    <div className="chat-container">
      <Sidebar onToolSelect={setSelectedTool} />
      <main className="main-content">
        {showSessionCheck && (
          <div className="session-check">
            <FiCheckCircle className="session-check__icon" />
            <span>Conexión establecida</span>
          </div>
        )}
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
          onFileChange={() => {}}
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
