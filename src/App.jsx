
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Inicio from './Pages/Inicio';
import PaginaChatbot from './Pages/Chatbot';
import { useState } from 'react';
import Notification from './Components/Notification/Notification';


function App() {
  const [notification, setNotification] = useState({ message: '', visible: false });

  const showNotification = (message, duration = 3000) => {
    setNotification({ message, visible: true });
    setTimeout(() => {
      setNotification({ message: '', visible: false });
    }, duration);
  };

  return (
    <BrowserRouter>
      <Notification
        message={notification.message}
        visible={notification.visible}
        onClose={() => setNotification({ message: '', visible: false })}
      />
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/chatbot" element={<PaginaChatbot showNotification={showNotification} />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
