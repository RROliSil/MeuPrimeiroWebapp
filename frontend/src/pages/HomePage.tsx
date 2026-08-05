import React, { useEffect, useState } from 'react';
import type { AppItem } from '../types/app';
import { fetchApps } from '../services/api';
import { AppGrid } from '../components/AppGrid';

export const HomePage: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApps();
      setApps(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Erro ao carregar os aplicativos');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApps();
  }, []);

  return (
    <div className="page-container">
      <div className="home-hero">
        <h2 className="home-title">Sua Estante de Aplicativos</h2>
        <p className="home-instructions">
          💡 Clique em qualquer aplicativo para abrir em uma nova aba. Arraste os ícones para organizar sua tela!
        </p>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Carregando seus aplicativos...</p>
        </div>
      ) : error ? (
        <div className="error-box">
          <p>❌ {error}</p>
          <button onClick={loadApps} className="btn-secondary">Tentar Novamente</button>
        </div>
      ) : (
        <AppGrid apps={apps} setApps={setApps} />
      )}
    </div>
  );
};
