import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import TopHeader from './components/TopHeader';
import AssistantPage from './pages/AssistantPage';
import QuizStudioPage from './pages/QuizStudioPage';
import KnowledgePage from './pages/KnowledgePage';
import AgentPage from './pages/AgentPage';
import DashboardPage from './pages/DashboardPage';
import PreferencesPage from './pages/PreferencesPage';
import { fetchHealth } from './services/api';

export default function App() {
  const [health, setHealth] = useState(null);

  const syncHealth = async () => {
    try {
      const data = await fetchHealth();
      setHealth(data);
    } catch (err) {
      console.warn('Health check sync:', err);
    }
  };

  useEffect(() => {
    syncHealth();
    const timer = setInterval(syncHealth, 20000);
    return () => clearInterval(timer);
  }, []);

  return (
    <HashRouter>
      <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
        {/* Sidebar Navigation */}
        <Navigation health={health} />

        {/* Main Content Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopHeader health={health} />

          <main className="flex-1 flex flex-col min-h-0 overflow-hidden relative">
            <Routes>
              <Route path="/" element={<AssistantPage />} />
              <Route path="/assistant" element={<Navigate to="/" replace />} />
              <Route path="/quiz" element={<QuizStudioPage />} />
              <Route path="/knowledge" element={<KnowledgePage />} />
              <Route path="/agent" element={<AgentPage />} />
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/preferences" element={<PreferencesPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
        </div>
      </div>
    </HashRouter>
  );
}
