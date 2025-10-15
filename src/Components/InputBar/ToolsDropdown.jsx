import React, { useState, useRef } from 'react';
import './ToolsDropdown.css';

const TOOLS = [
  'Análisis financiero',
  'Consultas contables',
  'Documentos',
];

const ToolsDropdown = ({ onSelect }) => {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar el menú si se hace click fuera
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="tools-dropdown" ref={dropdownRef}>
      <button
        className="tools-dropdown-btn"
        onClick={() => setOpen((v) => !v)}
        type="button"
        title="Herramientas"
      >
        <span className="tools-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" stroke="#0099e5" strokeWidth="1.5"/>
          </svg>
        </span>
        Herramientas
      </button>
      {open && (
        <div className="tools-dropdown-menu">
          {TOOLS.map((tool, idx) => (
            <button
              key={tool}
              className="tools-dropdown-item"
              onClick={() => {
                setOpen(false);
                if (onSelect) onSelect(tool);
              }}
              type="button"
            >
              {tool}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ToolsDropdown;
