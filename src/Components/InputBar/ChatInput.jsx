

import UploadButton from './UploadButton';
import MicButton from './MicButton';
import './ChatInput.css';
import './MicButton.css';



const ChatInput = ({ value, onChange, onSend, onFileChange }) => {
  // Función para actualizar el input con la transcripción
  const handleTranscript = (transcript) => {
    // Simula un evento de cambio para mantener compatibilidad
    onChange({ target: { value: transcript } });
  };

  return (
    <div className="chat-input-area">
      <UploadButton onFileChange={onFileChange} />
      <input
        type="text"
        placeholder="Escribe un mensaje..."
        value={value}
        onChange={onChange}
        onKeyDown={e => e.key === 'Enter' && onSend()}
      />
      <MicButton onTranscript={handleTranscript} />
      <button className="send-button" aria-label="Enviar mensaje" onClick={onSend}>
        <svg width="24" height="24" viewBox="0 0 24 24">
          <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
        </svg>
      </button>
    </div>
  );
};

export default ChatInput;
