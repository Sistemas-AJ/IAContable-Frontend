import React from 'react';
import './Sidebar.css';

const Sidebar = () => (
  <aside className="sidebar">
    <div className="sidebar-header">
      <span className="gemini-logo">IA Contable</span>
      <span className="sidebar-menu-icon">☰</span>
    </div>
    <div className="new-chat-button">+ Nuevo chat</div>
  </aside>
);

export default Sidebar;