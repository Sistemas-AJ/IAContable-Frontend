import React, { useRef, useEffect } from 'react';
import './ChatMessages.css'; // Importamos el nuevo archivo CSS
import excelIcon from '../../../assets/excel.png';
import wordIcon from '../../../assets/word.png';
import pdfIcon from '../../../assets/pdf.png';
import logo from '../../../assets/Ia.png';
import { formatBotMessage } from '../utils/formatBotMessage';

// Íconos para cada tipo de archivo
// Ahora usamos una clase CSS para darles estilo
const fileIcons = {
  pdf: (
    <img src={pdfIcon} alt="PDF" className="file-icon" />
  ),
  xls: (
    <img src={excelIcon} alt="Excel" className="file-icon" />
  ),
  xlsx: (
    <img src={excelIcon} alt="Excel" className="file-icon" />
  ),
  doc: (
    <img src={wordIcon} alt="Word" className="file-icon" />
  ),
  docx: (
    <img src={wordIcon} alt="Word" className="file-icon" />
  ),
};

function getFileType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  if (["pdf"].includes(ext)) return "pdf";
  if (["xls", "xlsx"].includes(ext)) return ext;
  if (["doc", "docx"].includes(ext)) return ext;
  return null;
}

function renderFileMessage(msg, onDelete) {
  const type = getFileType(msg.fileName || msg.text);
  if (!type) return null;
  const fileName = msg.fileName || msg.text;
  
  const maxNameLength = 18;
  const shortName = fileName.length > maxNameLength
    ? fileName.slice(0, 15) + '...'
    : fileName;
  const ext = fileName.split('.').pop().toUpperCase();
  
  return (
    <div className="file-chip">
      <span className="file-chip-icon">{fileIcons[type]}</span>
      <a href={msg.fileUrl || '#'} target="_blank" rel="noopener noreferrer" className="file-chip-link">
        {shortName}
      </a>
      <span className="file-chip-ext">{ext}</span>
      {onDelete && (
        <button onClick={() => onDelete(msg)} className="file-chip-delete" title="Eliminar archivo">×</button>
      )}
    </div>
  );
}


const ChatMessages = ({ messages, isLoading, renderCustomSuccess }) => {
  const messagesEndRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="chat-messages" ref={containerRef}>
      {messages
        .filter(msg => {
          // Filtra mensajes que solo son puntos, el texto de "Pensando..." o mensajes del bot vacíos
          if (typeof msg.text === 'string') {
            const txt = msg.text.trim();
            if (txt === '' && !msg.isUser) return false; // Oculta mensajes vacíos del bot
            if (txt === '.' || txt === '..' || txt === '...' || txt === '....' || txt === '.....') return false;
            if (txt === '🧠 Pensando y buscando en mis conocimientos ...' || txt.startsWith('Pensando y buscando en mis conocimientos')) return false;
          }
          return true;
        })
        .map((msg) => {
          const isFinancialAnalysis =
            !msg.isUser && typeof msg.text === 'string' &&
            (
              msg.text.includes('Análisis de Ratios Financieros') ||
              msg.text.includes('Balance General') ||
              msg.text.includes('Estado de Resultados')
            );

          const fileType = getFileType(msg.fileName || (msg.file && msg.file.name) || msg.text);
          const isFile = !!fileType;
          const hasFileAndQuestion = msg.isUser && msg.file && msg.question;
          const handleDelete = null;

          return (
            <div key={msg.id || msg.text} className={`message ${msg.isUser ? 'user' : 'bot'} ${msg.isLoading ? 'loading' : ''}`}>
              {/* Eliminado indicador de carga por solicitud */}
              {msg.customSuccess && renderCustomSuccess ? (
                renderCustomSuccess(msg)
              ) : hasFileAndQuestion ? (
                // Mensaje de usuario con archivo + pregunta
                <div className="user-message-compound">
                  {/* Línea archivo */}
                  <div className="user-message-file-line">
                <span className="user-message-file-icon">{fileIcons[fileType]}</span>
                <span className="user-message-file-name">{msg.file.name.replace(/\.[^.]+$/, '')}</span>
                  </div>
                  {/* Línea pregunta */}
                  <div className="user-message-question-line">
                    {msg.question}
                  </div>
                </div>
              ) : (
                // Otros tipos de mensajes
                isFile ? (
                  renderFileMessage(msg, handleDelete)
                ) : msg.isUser ? (
                  <div className="user-message">{msg.text}</div>
                ) : isFinancialAnalysis ? (
                  <div className="bot-row">
                    <img src={logo} alt="Logo" className="bot-logo" />
                    <div className="chatbot-analysis bot-message">{formatBotMessage(msg.text, true)}</div>
                  </div>
                ) : (
                  <div className="bot-row">
                    <img src={logo} alt="Logo" className="bot-logo" />
                    <div className="bot-message">{formatBotMessage(msg.text)}</div>
                  </div>
                )
              )}
            </div>
          );
        })}
      {isLoading && (
        <div className="message bot loading">
          <div className="loading-indicator">
            <div className="loading-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            {/* Envolvemos el texto en un span para poder darle estilo */}
            <span className="loading-text">
              🧠 Pensando y buscando en mis conocimientos ...
            </span>
          </div>
        </div>
      )}
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatMessages;