import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="shelf-app">
          <Header />
          <main className="shelf-main-content">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/admin" element={<AdminPage />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
