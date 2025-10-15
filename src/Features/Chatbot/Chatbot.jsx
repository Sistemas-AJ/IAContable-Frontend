
import React, { useState } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');
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
    }
  };

  return (
    <div className="chat-container">
      <Sidebar />
      <main className="main-content">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h1>Hola, </h1>
            <p>¿Cómo puedo ayudarte hoy?</p>
          </div>
        ) : (
          <div className="chat-messages">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`chat-message-row ${msg.from === 'user' ? 'user' : 'bot'}`}
              >
                <div className={`chat-bubble ${msg.from === 'user' ? 'user' : 'bot'}`}>{msg.text}</div>
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