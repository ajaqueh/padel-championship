	import React from 'react';
	import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
	import { AuthProvider } from './contexts/AuthContext';
	import { ProtectedRoute } from './components/common/ProtectedRoute';
	import { Layout } from './components/layout/Layout';

	// Pages
	import { LoginPage } from './pages/LoginPage';
	import { DashboardPage } from './pages/DashboardPage';
	import { ChampionshipsPage } from './pages/ChampionshipsPage';
	import { StandingsPage } from './pages/StandingsPage';

	function App() {
	  return (
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
						  <Route path="/championships/:id/standings" element={<StandingsPage />} />
						  <Route path="/courts" element={<CourtsPage />} />
						</Routes>
					  </Layout>
					</ProtectedRoute>
				  }
				/>
			  </Routes>
			</div>
		  </Router>
		</AuthProvider>
	  );
	}