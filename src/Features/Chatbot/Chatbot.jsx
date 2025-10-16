
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';
import { useState } from 'react';
import { useChatMessages } from './hooks/useChatMessages';
import { sendMessageToBackend, uploadFileToBackend } from '../../services/chatService';
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
      const data = await sendMessageToBackend(userMessage.text);
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
        const data = await uploadFileToBackend(file);
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: `✅ Archivo "${data.filename}" procesado exitosamente. ${selectedTool === 'Ratios financieros' ? '📊 Calculando ratios financieros...' : 'Ahora puedes preguntarme sobre su contenido.'}`, isLoading: false }
            : msg
        ));

        // Si se seleccionó "Ratios financieros" y es un archivo Excel, calcular automáticamente los ratios
        if (selectedTool === 'Ratios financieros' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))) {
          setIsLoading(true);
          try {
            const ratiosData = await sendMessageToBackend('dame los ratios');
            const ratiosBotMessage = { text: ratiosData.response, isUser: false, id: Date.now() + 2 };
            addMessage(ratiosBotMessage);
            setSelectedTool(null);
          } catch (error) {
            console.error('Error al calcular ratios:', error);
            const errorMessage = { text: 'Lo siento, hubo un error al calcular los ratios.', isUser: false, id: Date.now() + 2 };
            addMessage(errorMessage);
          } finally {
            setIsLoading(false);
          }
        }

      } catch (error) {
        console.error('Error al subir archivo:', error);
        setMessages(prev => prev.map(msg =>
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