import React, { useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa';
import './MicButton.css';

const MicButton = ({ onTranscript }) => {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      alert('La API de reconocimiento de voz no está soportada en este navegador.');
      return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'es-ES';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onresult = (event) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        transcript += event.results[i][0].transcript;
      }
      if (onTranscript) onTranscript(transcript);
    };
    recognition.onend = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setListening(false);
    }
  };

  return (
    <button
      className={`mic-btn ${listening ? 'active' : ''}`}
      onClick={listening ? stopListening : startListening}
      title={listening ? 'Detener micrófono' : 'Hablar por micrófono'}
      type="button"
    >
      {listening ? <FaMicrophoneSlash /> : <FaMicrophone />}
    </button>
  );
};

export default MicButton;
