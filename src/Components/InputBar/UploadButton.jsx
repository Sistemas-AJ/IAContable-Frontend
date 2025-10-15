import React from 'react';
import './UploadButton.css';

const UploadButton = ({ onFileChange }) => {
  return (
    <label className="upload-btn" title="Subir archivo">
      <span className="upload-icon">+</span>
      <input
        type="file"
        style={{ display: 'none' }}
        onChange={onFileChange}
      />
    </label>
  );
};

export default UploadButton;
