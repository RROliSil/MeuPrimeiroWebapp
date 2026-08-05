import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="shelf-header">
      <div className="header-brand">
        <h1 className="shelf-title">SHELF</h1>
      </div>

      <div className="header-right-group">
        <nav className="header-nav">
          <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            📱 Home
          </NavLink>
          <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
            ⚙️ Painel Admin
          </NavLink>
        </nav>

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
        </button>
      </div>
    </header>
  );
};
