import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';

export const Header: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { searchQuery, setSearchQuery, clearSearch } = useSearch();

  return (
    <header className="shelf-header">
      <div className="header-brand">
        <Link to="/" onClick={clearSearch} title="Ir para a página inicial">
          <img src="/shelf-icon.svg" alt="SHELF Logo" className="shelf-header-logo" />
        </Link>
        <h1 className="shelf-title">SHELF</h1>
      </div>

      {user && (
        <div className="header-search-container">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            className="header-search-input"
            placeholder="Buscar aplicativo..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button className="search-clear-btn" onClick={clearSearch} title="Limpar busca">
              ✕
            </button>
          )}
        </div>
      )}

      <div className="header-right-group">
        {user && user.role === 'admin' && (
          <nav className="header-nav">
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
          className="theme-toggle-btn icon-only"
          onClick={toggleTheme}
          title={`Alternar para modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
          aria-label="Alternar Tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
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
