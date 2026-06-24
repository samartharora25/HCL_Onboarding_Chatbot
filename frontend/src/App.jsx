import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Chatbot from './components/Chatbot';
import AboutModal from './components/AboutModal';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [isAboutOpen, setIsAboutOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check user session on mount
  useEffect(() => {
    const checkSession = () => {
      const storedUser = localStorage.getItem('simulated_user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    };

    checkSession();
  }, []);

  // Fetch Onboarding summaries from backend
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '');
        const response = await fetch(`${apiBaseUrl}/api/summary`);
        if (response.ok) {
          const data = await response.json();
          setSummaryData(data);
        }
      } catch (error) {
        console.log("Could not load summary from API, using local mock data.");
      }
    };
    fetchSummary();
  }, []);

  const handleAuthSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('simulated_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    localStorage.removeItem('simulated_user');
    setUser(null);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 font-sans">
        <div className="text-center">
          <div className="loading-spinner"></div>
          <p className="mt-4 text-slate-500 font-semibold">Initializing HCL Tech Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-viewport">
      <Navbar 
        onOpenAbout={() => setIsAboutOpen(true)} 
        user={user} 
        onLogout={handleLogout} 
      />
      
      <main className="app-main-content">
        {user ? (
          <Chatbot user={user} />
        ) : (
          <Login onAuthSuccess={handleAuthSuccess} />
        )}
      </main>

      <AboutModal 
        isOpen={isAboutOpen} 
        onClose={() => setIsAboutOpen(false)} 
        summaryData={summaryData}
      />
    </div>
  );
}

export default App;
