import React from 'react';
import './Sidebar.css';
import ToolsDropdown from '../InputBar/ToolsDropdown';
import logo from '../../assets/logo.png';
import { FiX } from 'react-icons/fi';


  
// Recibe onToolSelect como prop
const Sidebar = ({ onToolSelect, onClose, closing = false }) => (
  <aside className={`sidebar ${closing ? 'sidebar--closing' : 'sidebar--open'}`}>
    {onClose && (
      <button
        type="button"
        className="sidebar-close"
        onClick={onClose}
        aria-label="Cerrar menú lateral"
      >
        <FiX />
      </button>
    )}
    <div className="sidebar-header">
      <img src={logo} alt="Logo IA Contable" className="sidebar-logo" />
      <span className="gemini-logo">IA Contable</span>
    </div>
    <div className="sidebar-tools">
      <ToolsDropdown onSelect={onToolSelect} />
    </div>
  </aside>
);

export default Sidebar;
