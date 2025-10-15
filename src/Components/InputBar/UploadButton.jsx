import React from 'react';
import './UploadButton.css';

const UploadButton = ({ onFileChange, disabled = false }) => {
  return (
<<<<<<< HEAD
    <label className="upload-btn" title="Subir archivo">
        <span className="upload-icon">+</span> 
=======
    <label className={`upload-btn ${disabled ? 'disabled' : ''}`} title="Subir archivo">
      <span className="upload-icon">+</span>
>>>>>>> c15161d9ad1087b8f4740cb896c9b6e6998cc49b
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
