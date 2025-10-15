import React from 'react';
import './UploadButton.css';

const UploadButton = ({ onFileChange, disabled = false }) => {
  return (
    <label className={`upload-btn ${disabled ? 'disabled' : ''}`} title="Subir archivo">
      <span className="upload-icon">+</span>
      <input
        type="file"
        style={{ display: 'none' }}
        onChange={onFileChange}
        disabled={disabled}
      />
    </label>
  );
};

export default UploadButton;
