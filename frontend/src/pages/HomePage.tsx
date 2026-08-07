import React, { useEffect, useState, useCallback } from 'react';
import type { AppItem, AppPingStatus } from '../types/app';
import { fetchApps, pingAllApps } from '../services/api';
import { AppGrid } from '../components/AppGrid';

export const HomePage: React.FC = () => {
  const [apps, setApps] = useState<AppItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [pings, setPings] = useState<Record<number, AppPingStatus>>({});
  const [checkingPings, setCheckingPings] = useState<boolean>(false);

  const checkStatus = useCallback(async (currentApps: AppItem[]) => {
    if (currentApps.length === 0) return;

    setCheckingPings(true);

    // Marca todos como "checking" inicialmente
    const initialChecking: Record<number, AppPingStatus> = {};
    currentApps.forEach((app) => {
      initialChecking[app.id] = { status: 'checking' };
    });
    setPings(initialChecking);

    try {
      const results = await pingAllApps();
      setPings(results);
    } catch (err) {
      console.error('Erro ao checar status dos serviços:', err);
    } finally {
      setCheckingPings(false);
    }
  }, []);

  const loadApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchApps();
      setApps(data);
      checkStatus(data);
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
        <>
          <div className="status-bar">
            <button
              onClick={() => checkStatus(apps)}
              className={`btn-ping ${checkingPings ? 'checking' : ''}`}
              disabled={checkingPings}
              title="Testar status de conexão de todas as aplicações"
            >
              <span className="ping-icon">📡</span>
              {checkingPings ? 'Verificando serviços...' : 'Verificar Status dos Serviços'}
            </button>
          </div>
          <AppGrid apps={apps} setApps={setApps} pings={pings} />
        </>
      )}
    </div>
  );
};
