import React from 'react';
import './Sidebar.css';
import ToolsDropdown from '../InputBar/ToolsDropdown';
import logo from '../../assets/logo.png';


  
// Recibe onToolSelect como prop
const Sidebar = ({ onToolSelect }) => (
  <aside className="sidebar">
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