


import React, { useState } from 'react';

import UploadButton from './UploadButton';
import MicButton from './MicButton';
import './ChatInput.css';
import './MicButton.css';

import excelIcon from '../../assets/excel.png';
import wordIcon from '../../assets/word.png';




const fileIcon = (file) => {
  // Detectar por extensión para Excel y Word
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (file.type.startsWith('image/')) {
    return (
      <span role="img" aria-label="Imagen" style={{fontSize: '1.3em'}}>🖼️</span>
    );
  } else if (file.type === 'application/pdf') {
    return (
      <span role="img" aria-label="PDF" style={{fontSize: '1.3em', color: '#e74c3c'}}>📄</span>
    );
  } else if (ext === 'xlsx' || ext === 'xls') {
    return (
      <img src={excelIcon} alt="Excel" style={{width: 28, height: 28, verticalAlign: 'middle'}} />
    );
  } else if (ext === 'docx' || ext === 'doc') {
    return (
      <img src={wordIcon} alt="Word" style={{width: 28, height: 28, verticalAlign: 'middle'}} />
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
  const [fileResetKey, setFileResetKey] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  // Función para actualizar el input con la transcripción
  const handleTranscript = (transcript) => {
    onChange({ target: { value: transcript } });
  };

  // Permitir múltiples archivos y acumularlos en el estado
  const addFiles = (files) => {
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
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
    if (onFileChange) {
      onFileChange(e);
    }
  };

  // Drag & Drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (disabled) return;
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      addFiles(files);
    }
  };
  // Manejar el envío de archivos y mensaje
  const handleSend = () => {
    if (selectedFiles.length > 0 && onSendFiles) {
      const filesToSend = [...selectedFiles];
      setSelectedFiles([]); // Limpiar archivos inmediatamente al enviar
      setFileResetKey(prev => prev + 1); // Forzar reset del input file
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
    <div
      className={`chat-input-area${dragActive ? ' drag-active' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
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
              <span className="file-preview-name" title={file.name}>
                {file.name}
              </span>
              <span className="file-preview-type">
                {file.name.split('.').pop()?.toUpperCase() || 'ARCHIVO'}
              </span>
              <button className="file-remove-btn" onClick={() => handleRemoveFile(idx)} title="Eliminar archivo">✖</button>
            </div>
          ))}
        </div>
      )}
      <div className="chat-input-row">
        <UploadButton onFileChange={handleFileChange} disabled={disabled} resetTrigger={fileResetKey} />
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
      {/* Overlay visual para drag & drop */}
      {dragActive && (
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(127,215,231,0.13)',
            border: '2px dashed #0099e5',
            borderRadius: 30,
            zIndex: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
            fontSize: 22,
            color: '#0099e5',
            fontWeight: 600
          }}
        >
          Suelta el archivo aquí
        </div>
      )}
    </div>
  );
};

export default ChatInput;
