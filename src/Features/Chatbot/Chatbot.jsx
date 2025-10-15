
import React, { useState } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');
<<<<<<< HEAD
  const [messages, setMessages] = useState([]); // Historial de mensajes

  // Enviar mensaje y agregarlo al historial
  const handleSend = () => {
    if (input.trim() === '') return;
    setMessages(prev => [...prev, { from: 'user', text: input }]);
    setInput('');
    // Aquí podrías hacer la llamada a la IA y luego agregar la respuesta al historial
    // setMessages(prev => [...prev, { from: 'bot', text: 'Respuesta de ejemplo' }]);
  };

  // Manejar archivo subido (puedes expandir esto según tu lógica)
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('Archivo seleccionado:', file);
=======
  const [messages, setMessages] = useState([]);

  // Función para enviar mensaje al backend
  const handleSend = async () => {
    if (input.trim() === '') return;

    const userMessage = { text: input, isUser: true };
    setMessages(prev => [...prev, userMessage]);
    setInput('');

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
      const botMessage = { text: data.response, isUser: false };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      const errorMessage = { text: 'Lo siento, hubo un error al procesar tu mensaje.', isUser: false };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Manejar archivo subido
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const formData = new FormData();
      formData.append('file', file);

      try {
        const response = await fetch('http://127.0.0.1:9000/upload-document', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Error al subir el archivo');
        }

        const data = await response.json();
        const uploadMessage = { text: `Archivo "${data.filename}" subido y en proceso de indexación.`, isUser: false };
        setMessages(prev => [...prev, uploadMessage]);
      } catch (error) {
        console.error('Error al subir archivo:', error);
        const errorMessage = { text: 'Error al subir el archivo.', isUser: false };
        setMessages(prev => [...prev, errorMessage]);
      }
>>>>>>> 4c9807cad32cc1f706ee419666d8b361a8d1ec39
    }
  };

  return (
    <div className="chat-container">
      <Sidebar />
      <main className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-message">
<<<<<<< HEAD
            <h1>Hola, </h1>
=======
            <h1>Hola,</h1>
>>>>>>> 4c9807cad32cc1f706ee419666d8b361a8d1ec39
            <p>¿Cómo puedo ayudarte hoy?</p>
          </div>
        ) : (
          <div className="chat-messages">
<<<<<<< HEAD
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message-row ${msg.from === 'user' ? 'user' : 'bot'}`}
              >
                <div className={`chat-bubble ${msg.from === 'user' ? 'user' : 'bot'}`}>{msg.text}</div>
=======
            {messages.map((msg, index) => (
              <div key={index} className={`message ${msg.isUser ? 'user' : 'bot'}`}>
                {msg.text}
>>>>>>> 4c9807cad32cc1f706ee419666d8b361a8d1ec39
              </div>
            ))}
          </div>
        )}
        <ChatInput
          value={input}
          onChange={e => setInput(e.target.value)}
          onSend={handleSend}
          onFileChange={handleFileChange}
        />
      </main>
    </div>
  );
};

export default Chatbot;