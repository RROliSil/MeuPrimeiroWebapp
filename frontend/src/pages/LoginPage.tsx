import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [username, setUsername] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      if (isRegister) {
        await register(username, password);
      } else {
        await login(username, password);
      }
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocorreu um erro ao processar sua solicitação.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header-brand">
          <img src="/shelf-icon.svg" alt="SHELF Logo" className="login-brand-logo" />
          <h1 className="login-title">SHELF</h1>
          <p className="login-subtitle">
            {isRegister ? 'Crie sua conta para acessar os atalhos' : 'Faça login para acessar os aplicativos'}
          </p>
        </div>

        <div className="login-tabs">
          <button
            type="button"
            className={`login-tab-btn ${!isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(false);
              setError(null);
            }}
          >
            🔑 Entrar
          </button>
          <button
            type="button"
            className={`login-tab-btn ${isRegister ? 'active' : ''}`}
            onClick={() => {
              setIsRegister(true);
              setError(null);
            }}
          >
            ✨ Criar Conta
          </button>
        </div>

        {error && <div className="alert-banner error">❌ {error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="login-username">Nome de Usuário</label>
            <input
              id="login-username"
              type="text"
              placeholder="Digite seu usuário..."
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Senha</label>
            <input
              id="login-password"
              type="password"
              placeholder="Digite sua senha..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn-primary login-btn-submit" disabled={submitting}>
            {submitting ? 'Aguarde...' : isRegister ? 'Criar Minha Conta' : 'Entrar no Sistema'}
          </button>
        </form>
      </div>
    </div>
  );
};
