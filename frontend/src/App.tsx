// src/App.tsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Layout } from './components/layout/Layout';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ChampionshipsPage } from './pages/ChampionshipsPage';
import { ChampionshipDetailPage } from './pages/ChampionshipDetailPage';
import { TeamsPage } from './pages/TeamsPage';
import { MatchesPage } from './pages/MatchesPage';
import { CourtsPage } from './pages/CourtsPage';
import { StandingsPage } from './pages/StandingsPage';

import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutos
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route
                path="/*"
                element={
                  <ProtectedRoute>
                    <Layout>
                      <Routes>
                        <Route path="/" element={<Navigate to="/dashboard" replace />} />
                        <Route path="/dashboard" element={<DashboardPage />} />
                        <Route path="/championships" element={<ChampionshipsPage />} />
                        <Route path="/championships/:id" element={<ChampionshipDetailPage />} />
                        <Route path="/championships/:id/teams" element={<TeamsPage />} />
                        <Route path="/championships/:id/matches" element={<MatchesPage />} />
                        <Route path="/championships/:id/standings" element={<StandingsPage />} />
                        <Route path="/courts" element={<CourtsPage />} />
                      </Routes>
                    </Layout>
                  </ProtectedRoute>
                }
              />
            </Routes>
            <Toaster position="top-right" />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;