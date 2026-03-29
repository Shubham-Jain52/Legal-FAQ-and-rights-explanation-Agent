import React, { useState, useEffect } from 'react';
import './App.css';
import UploadPanel from './components/UploadPanel';
import BriefDisplay from './components/BriefDisplay';
import LoadingSpinner from './components/LoadingSpinner';
import ErrorBanner from './components/ErrorBanner';
import { analyzeCase, healthCheck } from './services/api';

function App() {
  const [brief, setBrief] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [backendStatus, setBackendStatus] = useState(null);

  // Check backend health on mount
  useEffect(() => {
    healthCheck()
      .then(data => setBackendStatus(data))
      .catch(() => setBackendStatus({ status: 'offline', vector_store_ready: false }));
  }, []);

  const handleAnalyze = async (docA, docB) => {
    setIsLoading(true);
    setError(null);
    setBrief(null);

    try {
      const result = await analyzeCase(docA, docB);
      if (result.status === 'success' && result.judicial_brief) {
        setBrief(result.judicial_brief);
      } else {
        setError(result.message || 'Analysis returned no results.');
      }
    } catch (err) {
      const msg = err.response?.data?.detail
        || err.response?.data?.message
        || err.message
        || 'An unexpected error occurred.';
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">⚖️</span>
            <h1>Case Analyzer</h1>
            <span className="logo-subtitle">AI-Powered Comparative Legal Analysis</span>
          </div>
          <div className="header-status">
            {backendStatus && (
              <span className={`status-badge ${backendStatus.status === 'ok' ? 'online' : 'offline'}`}>
                {backendStatus.status === 'ok' ? '🟢' : '🔴'}
                {backendStatus.status === 'ok'
                  ? `Online · ${backendStatus.documents_count} precedents`
                  : 'Backend Offline'}
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Error Banner */}
      <ErrorBanner error={error} onDismiss={() => setError(null)} />

      {/* Loading Overlay */}
      {isLoading && <LoadingSpinner />}

      {/* Main Split-Screen */}
      <main className="app-main">
        <div className="split-left">
          <UploadPanel onAnalyze={handleAnalyze} isLoading={isLoading} />
        </div>
        <div className="split-divider"></div>
        <div className="split-right">
          <BriefDisplay brief={brief} />
        </div>
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>
          ⚠️ <strong>Disclaimer:</strong> This tool is an analytical aid only.
          It does NOT provide legal advice or predict outcomes.
          Always consult a qualified legal professional.
        </p>
      </footer>
    </div>
  );
}

export default App;
