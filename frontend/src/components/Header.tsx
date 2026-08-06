import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="shelf-header">
      <div className="header-brand">
        <h1 className="shelf-title">SHELF</h1>
      </div>

      <div className="header-right-group">
        {user && user.role === 'admin' && (
          <nav className="header-nav">
            <NavLink to="/" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              📱 Home
            </NavLink>
            <NavLink to="/admin" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
              ⚙️ Painel Admin
            </NavLink>
          </nav>
        )}

        {user && (
          <div className="user-badge" title={`Logado como ${user.username} (${user.role})`}>
            <span className="user-name">👤 {user.username}</span>
            <span className={`user-role-pill ${user.role}`}>{user.role}</span>
          </div>
        )}

        <button
          className="theme-toggle-btn"
          onClick={toggleTheme}
          title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? '☀️ Modo Claro' : '🌙 Modo Escuro'}
        </button>

        {user && (
          <button className="logout-btn" onClick={logout} title="Sair da Conta">
            🚪 Sair
          </button>
        )}
      </div>
    </header>
  );
};
