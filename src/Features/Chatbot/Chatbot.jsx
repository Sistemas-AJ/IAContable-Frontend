import React, { useState } from 'react';
import Sidebar from '../../Components/Sidebar/Sidebar';
import ChatInput from '../../Components/InputBar/ChatInput';
import './Chatbot.css';

const Chatbot = () => {
  const [input, setInput] = useState('');

  // Aquí puedes manejar el envío del mensaje
  const handleSend = () => {
    if (input.trim() === '') return;
    // Lógica para enviar el mensaje
    setInput('');
  };

  // Manejar archivo subido
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Aquí puedes manejar el archivo (mostrar, enviar, etc)
      console.log('Archivo seleccionado:', file);
    }
  };

  return (
    <div className="chat-container">
      <Sidebar />
      <main className="main-content">
        {/* El contenedor del mensaje ahora tiene título y subtítulo para una mejor bienvenida */}
        <div className="welcome-message">
          <h1>Hola, ajsistemas</h1>
          <p>¿Cómo puedo ayudarte hoy?</p>
        </div>
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