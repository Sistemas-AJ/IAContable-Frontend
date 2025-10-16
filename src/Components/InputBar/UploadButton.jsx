
import React, { useRef, useEffect } from 'react';
import { FiUpload } from 'react-icons/fi';
import './UploadButton.css';

const UploadButton = ({ onFileChange, disabled = false, resetTrigger }) => {
  const inputRef = useRef(null);

  // Resetear el input cuando cambie resetTrigger
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }, [resetTrigger]);

  return (
    <label className={`upload-btn modern-upload ${disabled ? 'disabled' : ''}`} title="Subir archivo">
      <span className="upload-icon">
        <FiUpload size={22} style={{ verticalAlign: 'middle' }} />
      </span>
      <input
        ref={inputRef}
        type="file"
        style={{ display: 'none' }}
        onChange={onFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export default UploadButton;
