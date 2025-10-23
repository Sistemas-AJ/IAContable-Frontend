import React, { useState } from 'react';

import UploadButton from './UploadButton';
import MicButton from './MicButton';
import './ChatInput.css';
import './MicButton.css';
import excelIcon from '../../assets/excel.png';
import wordIcon from '../../assets/word.png';
import pdfIcon from '../../assets/pdf.png';


const fileIcon = (file) => {
  // Detectar por extensión para Excel y Word
  const ext = file.name.split('.').pop()?.toLowerCase();
  if (file.type.startsWith('image/')) {
    return (
  <span role="img" aria-label="Imagen" className="file-icon-image">🖼️</span>
    );
  } else if (file.type === 'application/pdf') {
    return (
    <img src={pdfIcon} alt="PDF" className="file-icon-pdf" />
    );
  } else if (ext === 'xlsx' || ext === 'xls') {
    return (
  <img src={excelIcon} alt="Excel" className="file-icon-excel" />
    );
  } else if (ext === 'docx' || ext === 'doc') {
    return (
  <img src={wordIcon} alt="Word" className="file-icon-word" />
    );
  } else if (file.type.startsWith('video/')) {
    return (
  <span role="img" aria-label="Video" className="file-icon-video">🎬</span>
    );
  } else if (file.type.startsWith('audio/')) {
    return (
  <span role="img" aria-label="Audio" className="file-icon-audio">🎵</span>
    );
  } else {
    return (
  <span role="img" aria-label="Archivo" className="file-icon-generic">📎</span>
    );
  }
};

const ChatInput = ({ value, onChange, onSend, onFileChange, disabled = false, onClearFiles, onSendFiles, selectedTool, onRemoveTool }) => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileResetKey, setFileResetKey] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const textareaRef = React.useRef(null);

  // Función para actualizar el input con la transcripción
  const handleTranscript = (transcript) => {
    onChange({ target: { value: transcript } });
  };

  // Autoajustar altura del textarea
  React.useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  // Permitir múltiples archivos y acumularlos en el estado
    const addFiles = (files) => {
      if (files.length > 0) {
        setSelectedFiles([files[0]]); // Solo permite un archivo a la vez
      }
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
      style={{ position: 'relative' }}
    >
      {/* Herramienta seleccionada (solo mostrar, no seleccionar aquí) */}
      {selectedTool && (
        <div className="selected-tool-tag">
          <span>{selectedTool}</span>
          {onRemoveTool && (
            <button className="remove-tool-btn" onClick={onRemoveTool} title="Quitar herramienta">×</button>
          )}
        </div>
      )}
      {/* Vista previa de archivos */}
        {selectedFiles.length > 0 && (
          <div className="file-preview-list">
            <div className="file-preview-item" key={0}>
              {fileIcon(selectedFiles[0])}
              <span className="file-preview-name" title={selectedFiles[0].name}>
                {selectedFiles[0].name}
              </span>
              <span className="file-preview-type">
                {selectedFiles[0].name.split('.').pop()?.toUpperCase() || 'ARCHIVO'}
              </span>
              <button className="file-remove-btn" onClick={() => handleRemoveFile(0)} title="Eliminar archivo">✖</button>
            </div>
          </div>
        )}
      <div className="chat-input-row">
        <UploadButton onFileChange={handleFileChange} disabled={disabled} resetTrigger={fileResetKey} />
        <textarea
          ref={textareaRef}
          className="chat-textarea"
          placeholder={selectedTool ? `Sube un archivo Excel para ${selectedTool.toLowerCase()}...` : "Escribe un mensaje..."}
          value={value}
          onChange={onChange}
          rows={1}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && !disabled && handleSend()}
          disabled={disabled}
          style={{ resize: 'none', overflowY: 'auto' }}
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
        <div className="drag-overlay">Suelta el archivo aquí</div>
      )}
    </div>
  );
};

export default ChatInput;
