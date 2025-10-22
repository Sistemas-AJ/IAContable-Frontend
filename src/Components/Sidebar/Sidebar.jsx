import React, { useState, useRef, useEffect } from 'react';
import './Sidebar.css';
import ToolsDropdown from '../InputBar/ToolsDropdown';
import logo from '../../assets/logo.png';


  
// Recibe onToolSelect como prop

const Sidebar = ({ onToolSelect, onSidebarState }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hoverTimeout = useRef(null);

  // Mostrar sidebar al acercar el mouse a la esquina izquierda
  const handleMouseMove = (e) => {
    if (e.clientX <= 32) {
      if (!isOpen) setIsOpen(true);
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
    } else if (isOpen && e.clientX > 220) {
      // Si el mouse se aleja del sidebar, ocultar después de un breve tiempo
      if (!hoverTimeout.current) {
        hoverTimeout.current = setTimeout(() => {
          setIsOpen(false);
          hoverTimeout.current = null;
        }, 350);
      }
    }
  };

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (hoverTimeout.current) clearTimeout(hoverTimeout.current);
    };
  }, [isOpen]);

  // Notificar al padre el estado del sidebar
  useEffect(() => {
    if (onSidebarState) onSidebarState(isOpen);
  }, [isOpen, onSidebarState]);

  return (
    <aside className={`sidebar${isOpen ? ' open' : ' closed'}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Logo IA Contable" className="sidebar-logo" />
        <span className="gemini-logo">IA Contable</span>
      </div>
      <div className="sidebar-tools">
        <ToolsDropdown onSelect={onToolSelect} />
      </div>
    </aside>
  );
};

export default Sidebar;