import React from 'react';
import excelIcon from '../../../assets/excel.png';
import wordIcon from '../../../assets/word.png';
import pdfIcon from '../../../assets/pdf.png';
import { formatBotMessage } from '../utils/formatBotMessage.jsx';

// Íconos para cada tipo de archivo
const fileIcons = {
  pdf: (
    <img src={pdfIcon} alt="PDF" style={{ width: 28, height: 28, marginRight: 2 }} />
  ),
  xls: (
    <img src={excelIcon} alt="Excel" style={{ width: 28, height: 28, marginRight: 2 }} />
  ),
  xlsx: (
    <img src={excelIcon} alt="Excel" style={{ width: 28, height: 28, marginRight: 2 }} />
  ),
  doc: (
    <img src={wordIcon} alt="Word" style={{ width: 28, height: 28, marginRight: 2 }} />
  ),
  docx: (
    <img src={wordIcon} alt="Word" style={{ width: 28, height: 28, marginRight: 2 }} />
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
  // Recortar nombre si es muy largo
  const maxNameLength = 18;
  const shortName = fileName.length > maxNameLength
    ? fileName.slice(0, 15) + '...'
    : fileName;
  const ext = fileName.split('.').pop().toUpperCase();
  return (
    <div className="file-chip" style={{
      display: 'flex', alignItems: 'center', background: '#F4F8FB', borderRadius: '20px', padding: '6px 12px', margin: '6px 0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', maxWidth: 260
    }}>
      <span style={{ marginRight: 8 }}>{fileIcons[type]}</span>
      <a href={msg.fileUrl || '#'} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', color: '#1976D2', fontWeight: 'bold', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {shortName}
      </a>
      <span style={{ margin: '0 8px', color: '#1976D2', fontWeight: 'bold' }}>{ext}</span>
      {onDelete && (
        <button onClick={() => onDelete(msg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#1976D2', fontSize: 16, marginLeft: 4 }} title="Eliminar archivo">×</button>
      )}
    </div>
  );
}


const ChatMessages = ({ messages, isLoading, renderCustomSuccess }) => (
  <div className="chat-messages">
    {messages.map((msg) => {
      const isFinancialAnalysis =
        !msg.isUser && typeof msg.text === 'string' &&
        (
          msg.text.includes('Análisis de Ratios Financieros') ||
          msg.text.includes('Balance General') ||
          msg.text.includes('Estado de Resultados')
        );

      // Detectar si el mensaje es un archivo
      const fileType = getFileType(msg.fileName || (msg.file && msg.file.name) || msg.text);
      const isFile = !!fileType;

      // Mensaje del usuario con archivo y pregunta
      const hasFileAndQuestion = msg.isUser && msg.file && msg.question;

      // Puedes implementar la función de eliminar si lo necesitas
      const handleDelete = null; // (msg) => { ... }
      return (
        <div key={msg.id || msg.text} className={`message ${msg.isUser ? 'user' : 'bot'} ${msg.isLoading ? 'loading' : ''}`}>
          {msg.isLoading ? (
            <div className="loading-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          ) : msg.customSuccess && renderCustomSuccess ? (
            renderCustomSuccess(msg)
          ) : hasFileAndQuestion ? (
            <div className="user-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
              {/* Línea archivo */}
              <div style={{ display: 'flex', alignItems: 'center', background: '#F4F8FB', borderRadius: '20px', padding: '6px 12px', maxWidth: 260 }}>
                <span style={{ marginRight: 8 }}>{fileIcons[fileType]}</span>
                <span style={{ color: '#1976D2', fontWeight: 'bold' }}>{msg.file.name}</span>
                <span style={{ marginLeft: 8, color: '#1976D2', fontWeight: 'bold' }}>{msg.file.name.split('.').pop().toUpperCase()}</span>
              </div>
              {/* Línea pregunta */}
              <div style={{ marginTop: 2, background: '#eaf3ff', borderRadius: 12, padding: '8px 14px', color: '#222', fontSize: 15, maxWidth: 340 }}>
                {msg.question}
              </div>
            </div>
          ) : (
            isFile
              ? renderFileMessage(msg, handleDelete)
              : msg.isUser
                ? <div className="user-message">{msg.text}</div>
                : isFinancialAnalysis
                  ? <div className="chatbot-analysis bot-message">{formatBotMessage(msg.text, true)}</div>
                  : <div className="bot-message">{formatBotMessage(msg.text)}</div>
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
          🧠 Pensando y buscando en mis conocimientos ...
        </div>
      </div>
    )}
  </div>
);

export default ChatMessages;