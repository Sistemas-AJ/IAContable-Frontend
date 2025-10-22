// Notification.jsx (Sugerencia)
import React, { useEffect } from 'react';
import './Notification.css';
import { FaCheckCircle } from 'react-icons/fa'; // Importa un ícono de éxito

const Notification = ({ message, visible, onClose, duration = 3000 }) => {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [visible, duration, onClose]);

  if (!visible) return null;

  return (
    // Añade la clase 'notification-toast'
    <div className="notification-toast">
      {/* Añade el ícono */}
      <FaCheckCircle className="notification-icon" />
      {/* El mensaje */}
      <span>{message}</span>
    </div>
  );
};

export default Notification;