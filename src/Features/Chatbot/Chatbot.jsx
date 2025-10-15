
import React, { useState } from 'react';
import { BlockMath, InlineMath } from 'react-katex';
import 'katex/dist/katex.min.css';
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';


const Chatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const clearFilesRef = React.useRef(null);
  const setClearFiles = (fn) => {
    clearFilesRef.current = fn;
  };
  const [selectedTool, setSelectedTool] = useState(null);
  // Quitar herramienta seleccionada
  const handleRemoveTool = () => setSelectedTool(null);

    // Función para agregar mensaje manteniendo solo los últimos 10
    const addMessage = (message) => {
      setMessages(prev => {
        const newMessages = [...prev, message];
        // Mantener solo los últimos 10 mensajes
        return newMessages.length > 10 ? newMessages.slice(-10) : newMessages;
      });
    };

    // Función para formatear el mensaje del bot respetando saltos de línea y renderizando fórmulas
    function formatBotMessage(text) {
      if (!text) return null;
      // Eliminar todos los asteriscos '*' (Markdown bold/italic) y símbolos '#'
      const cleanText = text.replace(/\*/g, '').replace(/\#/g, '');
      // Si el texto contiene bloques LaTeX ($$...$$), los renderiza como BlockMath
      // Si contiene inline ($...$), los renderiza como InlineMath
      // El resto lo muestra con saltos de línea
      const blockRegex = /\$\$(.+?)\$\$/gs;
      const inlineRegex = /\$(.+?)\$/g;
      let elements = [];
      let lastIndex = 0;
      let match;
      let key = 0;

      // Procesar bloques $$...$$
      while ((match = blockRegex.exec(cleanText)) !== null) {
        if (match.index > lastIndex) {
          // Procesar el texto antes del bloque
          const before = cleanText.slice(lastIndex, match.index);
          elements.push(...before.split('\n').map((line, idx, arr) => (
            <React.Fragment key={key++}>
              {line}
              {idx !== arr.length - 1 && <br />}
            </React.Fragment>
          )));
        }
        elements.push(<BlockMath key={key++}>{match[1]}</BlockMath>);
        lastIndex = match.index + match[0].length;
      }
      if (lastIndex < cleanText.length) {
        // Procesar el texto restante (puede contener $...$ inline)
        const rest = cleanText.slice(lastIndex);
        let lastInline = 0;
        let inlineMatch;
        while ((inlineMatch = inlineRegex.exec(rest)) !== null) {
          if (inlineMatch.index > lastInline) {
            const before = rest.slice(lastInline, inlineMatch.index);
            elements.push(...before.split('\n').map((line, idx, arr) => (
              <React.Fragment key={key++}>
                {line}
                {idx !== arr.length - 1 && <br />}
              </React.Fragment>
            )));
          }
          elements.push(<InlineMath key={key++}>{inlineMatch[1]}</InlineMath>);
          lastInline = inlineMatch.index + inlineMatch[0].length;
        }
        if (lastInline < rest.length) {
          const after = rest.slice(lastInline);
          elements.push(...after.split('\n').map((line, idx, arr) => (
            <React.Fragment key={key++}>
              {line}
              {idx !== arr.length - 1 && <br />}
            </React.Fragment>
          )));
        }
      }
      return elements;
    }

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

  // Ya no subimos archivos automáticamente al seleccionar
  const handleFileChange = (e) => {
    // Solo actualiza el input, no sube archivos
  };

  // Subir archivos solo cuando se presiona enviar
  const handleSendFiles = async (files, text) => {
    if (!files || files.length === 0) return;
    for (const file of files) {
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

        const response = await fetch('http://127.0.0.1:9000/upload', {
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
            ? { ...msg, text: `✅ Archivo "${data.filename}" procesado exitosamente. ${selectedTool === 'Ratios financieros' ? '📊 Calculando ratios financieros...' : 'Ahora puedes preguntarme sobre su contenido.'}`, isLoading: false }
            : msg
        ));

        // Si se seleccionó "Ratios financieros" y es un archivo Excel, calcular automáticamente los ratios
        if (selectedTool === 'Ratios financieros' && (file.name.toLowerCase().endsWith('.xlsx') || file.name.toLowerCase().endsWith('.xls'))) {
          // Calcular ratios automáticamente sin mostrar mensaje del usuario
          setIsLoading(true);
          
          try {
            const ratiosResponse = await fetch('http://127.0.0.1:9000/chat', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ message: 'dame los ratios' }),
            });

            if (!ratiosResponse.ok) {
              throw new Error('Error al calcular ratios');
            }

            const ratiosData = await ratiosResponse.json();
            const ratiosBotMessage = { text: ratiosData.response, isUser: false, id: Date.now() + 2 };
            addMessage(ratiosBotMessage);
            
            // Limpiar la herramienta seleccionada después de usarla
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
        // Reemplazar mensaje de carga con mensaje de error
        setMessages(prev => prev.map(msg =>
          msg.id === loadingMessage.id
            ? { ...msg, text: '❌ Error al procesar el archivo. Inténtalo de nuevo.', isLoading: false }
            : msg
        ));
      } finally {
        setIsLoading(false);
        // Limpiar los archivos de la barra de entrada después del procesamiento
        if (clearFilesRef.current) {
          clearFilesRef.current();
        }
      }
    }
    // Si hay texto, también envíalo como mensaje
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
                  msg.isUser
                    ? msg.text
                    : formatBotMessage(msg.text)
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