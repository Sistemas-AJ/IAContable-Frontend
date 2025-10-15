


import React, { useState } from 'react';
import UploadButton from './UploadButton';
import MicButton from './MicButton';
import './ChatInput.css';
import './MicButton.css';




const fileIcon = (file) => {
  if (file.type.startsWith('image/')) {
    return (
      <span role="img" aria-label="Imagen" style={{fontSize: '1.3em'}}>🖼️</span>
    );
  } else if (file.type === 'application/pdf') {
    return (
      <span role="img" aria-label="PDF" style={{fontSize: '1.3em', color: '#e74c3c'}}>📄</span>
    );
  } else if (file.type.startsWith('video/')) {
    return (
      <span role="img" aria-label="Video" style={{fontSize: '1.3em'}}>🎬</span>
    );
  } else if (file.type.startsWith('audio/')) {
    return (
      <span role="img" aria-label="Audio" style={{fontSize: '1.3em'}}>🎵</span>
    );
  } else {
    return (
      <span role="img" aria-label="Archivo" style={{fontSize: '1.3em'}}>📎</span>
    );
  }
};

// Ahora acepta una prop onSendFiles para subir archivos
// Ahora recibe selectedTool y onRemoveTool por props
const ChatInput = ({ value, onChange, onSend, onFileChange, disabled = false, onClearFiles, onSendFiles, selectedTool, onRemoveTool }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Función para actualizar el input con la transcripción
  const handleTranscript = (transcript) => {
    onChange({ target: { value: transcript } });
  };

  // Permitir múltiples archivos y acumularlos en el estado
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(prevFiles => {
      // Evitar duplicados por nombre y tamaño
      const allFiles = [...prevFiles];
      files.forEach(newFile => {
        if (!allFiles.some(f => f.name === newFile.name && f.size === newFile.size)) {
          allFiles.push(newFile);
        }
      });
      return allFiles;
    });
    if (onFileChange) {
      onFileChange(e);
    }
  };
  // Manejar el envío de archivos y mensaje
  const handleSend = () => {
    if (selectedFiles.length > 0 && onSendFiles) {
      const filesToSend = [...selectedFiles];
      setSelectedFiles([]); // Limpiar archivos inmediatamente al enviar
      onSendFiles(filesToSend, value); // Enviar archivos y texto
    } else if (onSend) {
      onSend();
    }
  };

  // Eliminar archivo de la lista
  const handleRemoveFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Limpiar todos los archivos seleccionados
  const clearFiles = () => {
    setSelectedFiles([]);
  };

  // Exponer la función clearFiles al componente padre si se proporciona onClearFiles
  React.useEffect(() => {
    if (onClearFiles) {
      onClearFiles(clearFiles);
    }
  }, [onClearFiles]);

  return (
    <div className="chat-input-area">
      {/* Herramienta seleccionada (solo mostrar, no seleccionar aquí) */}
      {selectedTool && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: 8,
          background: '#e6f7fa',
          borderRadius: 16,
          padding: '4px 12px',
          width: 'fit-content',
          fontWeight: 500,
          fontSize: 15
        }}>
          <span>{selectedTool}</span>
          {onRemoveTool && (
            <button onClick={onRemoveTool} style={{
              marginLeft: 8,
              background: 'none',
              border: 'none',
              color: '#0099e5',
              fontSize: 18,
              cursor: 'pointer',
              lineHeight: 1
            }} title="Quitar herramienta">×</button>
          )}
        </div>
      )}
      {/* Vista previa de archivos */}
      {selectedFiles.length > 0 && (
        <div className="file-preview-list">
          {selectedFiles.map((file, idx) => (
            <div className="file-preview-item" key={idx}>
              {fileIcon(file)}
              <span className="file-preview-name" title={file.name}>{file.name.length > 25 ? file.name.slice(0,22) + '...' : file.name}</span>
              <span className="file-preview-type">{file.type.split('/')[1]?.toUpperCase() || 'ARCHIVO'}</span>
              <button className="file-remove-btn" onClick={() => handleRemoveFile(idx)} title="Eliminar archivo">✖</button>
            </div>
          ))}
        </div>
      )}
      <div className="chat-input-row">
        <UploadButton onFileChange={handleFileChange} disabled={disabled} />
        <textarea
          className="chat-textarea"
          placeholder={selectedTool ? `Sube un archivo Excel para ${selectedTool.toLowerCase()}...` : "Escribe un mensaje..."}
          value={value}
          onChange={onChange}
          rows={1}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !disabled && handleSend()}
          style={{ resize: 'none' }}
          disabled={disabled}
        />
        <div className="chat-input-buttons">
          <MicButton onTranscript={handleTranscript} disabled={disabled} />
          <button className="send-button" aria-label="Enviar mensaje" onClick={handleSend} disabled={disabled}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
