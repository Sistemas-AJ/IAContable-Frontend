import React from 'react';
import './Button.css';

function Button({ children, onClick, type = 'button', className = '' }) {
  return (
    <button className={`custom-btn ${className}`} type={type} onClick={onClick}>
      {children}
    </button>
  );
}

export default Button;
