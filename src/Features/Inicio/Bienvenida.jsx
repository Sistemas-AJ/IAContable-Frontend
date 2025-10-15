
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
    <div className="welcome-container">
      <div className="welcome-content">
        <h1 className="welcome-title">
          <span role="img" aria-label="robot">🤖</span> Bienvenido a <span style={{color:'#007bff'}}>IA Contable</span>
        </h1>
        <p className="welcome-subtitle">
          Tu asistente inteligente para simplificar y optimizar tus finanzas.<br/>
          <span style={{fontSize:'1.05rem', color:'#007bff'}}>¡Comienza tu experiencia profesional ahora!</span>
        </p>
        <Button onClick={handleStartClick}>
          Comenzar
        </Button>
      </div>
    </div>
  );

};

export default Bienvenida;
