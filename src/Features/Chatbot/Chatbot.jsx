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

  // --- INICIO DE FUNCIONES FALTANTES ---

  // --- handleSend (MODIFICADO PARA STREAMING) ---
  const handleSend = async () => {
    // Prueba de depuración:
    console.log("Chatbot.jsx: handleSend iniciado con input:", JSON.stringify(input)); // DEBUG

    if (input.trim() === '' || isLoading) {
      console.log("Chatbot.jsx: handleSend bloqueado. Input vacío o isLoading es true."); // DEBUG
      return;
    }
    
    const userMessage = { text: input, isUser: true, id: Date.now() };
    addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const filename = window.lastUploadedFile || null;
      const tool = selectedTool || null;
      const isFinancialAnalysis = /ratio|an[aá]lisis|liquidez|financier[ao]/i.test(input) && filename;

      if (isFinancialAnalysis) {
        console.log("Chatbot.jsx: Detectado análisis financiero."); // DEBUG
        // El análisis financiero NO es un stream, usa el método antiguo
        const data = { filename };
        const result = await analyzeFinancialData(data);
        const botMessage = { text: result.data ? JSON.stringify(result.data, null, 2) : result.message, isUser: false, id: Date.now() + 1 };
        addMessage(botMessage);
        setIsLoading(false); // Termina aquí
      } else {
        // --- LÓGICA DE STREAMING ---
        console.log("Chatbot.jsx: Iniciando lógica de streaming."); // DEBUG

        // 1. Crea un mensaje de bot vacío
        const botMessageId = Date.now() + 1;
        const botMessage = { text: '', isUser: false, id: botMessageId };
        addMessage(botMessage);

        // 2. Llama al servicio de streaming con callbacks
        await sendMessageToBackend(
          userMessage.text,
          filename,
          tool,
          // onMessage: Se llama cada vez que llega un pedazo de texto
          (chunk) => {
            console.log("Chatbot.jsx (onMessage): Recibido chunk:", JSON.stringify(chunk)); // DEBUG
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, text: msg.text + chunk } // Añade el chunk al texto existente
                  : msg
              )
            );
          },
          // onError: Se llama si el stream devuelve un error
          (errorText) => {
            console.error("Chatbot.jsx (onError): Error de stream reportado:", errorText); // DEBUG
            setMessages(prev =>
              prev.map(msg =>
                msg.id === botMessageId
                  ? { ...msg, text: `Lo siento, hubo un error: ${errorText}` }
                  : msg
              )
            );
          },
          // onEnd: Se llama cuando el stream finaliza (evento 'end')
          () => {
            console.log("Chatbot.jsx (onEnd): Stream finalizado."); // DEBUG
            setIsLoading(false); // Detiene el indicador de carga
            setSelectedTool(null); // Limpia la herramienta si se usó
          }
        );
      }
    } catch (error) {
      // Este es un error fatal (ej. fallo de red antes de conectar)
      console.error("Chatbot.jsx (catch): Error fatal en handleSend:", error); // DEBUG
      const errorMessage = { text: 'Lo siento, hubo un error al procesar tu mensaje.', isUser: false, id: Date.now() + 1 };
      addMessage(errorMessage);
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
          // Pre-populamos el input y llamamos a handleSend
          // (que ahora soporta streaming)
          setInput(text); // Pon el texto en el input
          // Usamos un pequeño timeout para que React actualice el estado de 'input'
          // antes de llamar a handleSend
          setTimeout(() => {
            handleSend(); 
          }, 0);
          
          // Limpiamos el input visualmente
          if (clearFilesRef.current) {
            clearFilesRef.current(); 
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
        // Solo limpiamos si no había texto para enviar
        if ((!text || text.trim() === '') && clearFilesRef.current) {
          clearFilesRef.current();
        }
      }
    }
  };

  // --- FIN DE FUNCIONES FALTANTES ---

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