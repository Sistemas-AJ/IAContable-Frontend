
import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';

import Inicio from './Pages/Inicio';
import PaginaChatbot from './Pages/Chatbot';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
                <Route path="/chatbot" element={<PaginaChatbot />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
