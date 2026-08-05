import { useState, useEffect } from 'react'
import './App.css'

interface HealthResponse {
  status: string
  message: string
  timestamp: string
  database?: string
}

function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)

  const checkBackendHealth = async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/health')
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      const data = await response.json()
      setHealth(data)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError('Erro ao conectar ao backend')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <div className="app-container">
      <header className="header">
        <div className="badge">Full-Stack Application</div>
        <h1>React + Express + PostgreSQL</h1>
        <p className="subtitle">
          Estrutura inicial completa configurada com Vite, TypeScript e Docker Compose.
        </p>
      </header>

      <main className="dashboard">
        <div className="dashboard-row-top">
          <div className="card">
            <div className="card-header">
              <span className="status-dot online"></span>
              <h3>Frontend</h3>
            </div>
            <div className="card-body">
              <p><strong>Tecnologia:</strong> React 19 + Vite + TypeScript</p>
              <p><strong>Status:</strong> <span className="text-success">Ativo & Operacional</span></p>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <span className={`status-dot ${health ? 'online' : loading ? 'pending' : 'offline'}`}></span>
              <h3>Backend API</h3>
            </div>
            <div className="card-body">
              <p><strong>Tecnologia:</strong> Node.js + Express + TypeScript</p>
              <p>
                <strong>Status:</strong>{' '}
                {loading ? (
                  <span className="text-warning">Conectando...</span>
                ) : health ? (
                  <span className="text-success">{health.message}</span>
                ) : (
                  <span className="text-danger">{error || 'Off-line'}</span>
                )}
              </p>
              {health && (
                <p className="timestamp">
                  <small>Última checagem: {new Date(health.timestamp).toLocaleTimeString()}</small>
                </p>
              )}
              <button className="btn-refresh" onClick={checkBackendHealth} disabled={loading}>
                {loading ? 'Verificando...' : 'Reverificar Backend'}
              </button>
            </div>
          </div>
        </div>

        <div className="dashboard-row-bottom">
          <div className="card">
            <div className="card-header">
              <span className={`status-dot ${health?.database === 'connected' ? 'online' : 'pending'}`}></span>
              <h3>Banco de Dados</h3>
            </div>
            <div className="card-body">
              <p><strong>Tecnologia:</strong> PostgreSQL 15 (Alpine)</p>
              <p>
                <strong>Status:</strong>{' '}
                {health?.database === 'connected' ? (
                  <span className="text-success">Conectado</span>
                ) : (
                  <span className="text-warning">Aguardando Container</span>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
