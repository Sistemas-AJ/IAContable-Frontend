
import React from 'react';
import { useNavigate } from 'react-router-dom';
import './Bienvenida.css';
import Button from '../../Components/ButtonInicio/Button';


const Bienvenida = () => {
  const navigate = useNavigate();
  const handleStartClick = () => {
    navigate('/chatbot');
  };

  return (
    <div className="welcome-container animated-bg">
      <div className="welcome-content animated-content">
        <h1 className="welcome-title gradient-text">
          Bienvenido a <span>IA Contable</span>
        </h1>
        <p className="welcome-subtitle">
          Tu asistente inteligente para simplificar y optimizar tus finanzas.<br/>
          <span className="welcome-highlight">¡Comienza tu experiencia profesional ahora!</span>
        </p>
        <Button onClick={handleStartClick}>
          <span className="button-icon">🚀</span> Comenzar
        </Button>
      </div>
    </div>
  );

};

export default Bienvenida;
