import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SearchProvider } from './context/SearchContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { LoginPage } from './pages/LoginPage';
import './App.css';

const AppContent: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="shelf-app">
        <Header />
        <main className="shelf-main-content">
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Carregando sistema...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="shelf-app">
        <Header />
        <main className="shelf-main-content">
          <LoginPage />
        </main>
      </div>
    );
  }

  return (
    <div className="shelf-app">
      <Header />
      <main className="shelf-main-content">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/admin"
            element={user.role === 'admin' ? <AdminPage /> : <Navigate to="/" replace />}
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SearchProvider>
          <Router>
            <AppContent />
          </Router>
        </SearchProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
