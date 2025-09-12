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

// src/types/index.ts

export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'gestor';
}

export interface Championship {
  id: number;
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: string;
  end_date?: string;
  num_groups: number;
  points_win: number;
  points_loss: number;
  status: 'draft' | 'active' | 'finished';
  created_by: number;
  created_by_name?: string;
  created_at: string;
}

export interface Team {
  id: number;
  name: string;
  player1_name: string;
  player2_name: string;
  championship_id: number;
  group_number: number;
  created_at: string;
}

export interface Match {
  id: number;
  championship_id: number;
  team1_id: number;
  team2_id: number;
  court_id?: number;
  round: number;
  group_number: number;
  scheduled_date?: string;
  status: 'pending' | 'playing' | 'finished';
  team1_sets: number;
  team2_sets: number;
  team1_games: number;
  team2_games: number;
  winner_id?: number;
  team1_name?: string;
  team2_name?: string;
  court_name?: string;
  sets?: MatchSet[];
}

export interface MatchSet {
  id: number;
  match_id: number;
  set_number: number;
  team1_games: number;
  team2_games: number;
}

export interface Standing {
  id: number;
  championship_id: number;
  team_id: number;
  group_number: number;
  points: number;
  matches_played: number;
  matches_won: number;
  matches_lost: number;
  sets_won: number;
  sets_lost: number;
  games_won: number;
  games_lost: number;
  position: number;
  team_name: string;
  player1_name: string;
  player2_name: string;
  updated_at: string;
}

export interface Court {
  id: number;
  name: string;
  is_active: boolean;
  created_at: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

// src/contexts/AuthContext.tsx

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authService } from '../services/authService';
import { AuthContextType, User } from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verificar si el token es válido
      authService.getCurrentUser()
        .then(userData => {
          setUser(userData);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authService.login(email, password);
      localStorage.setItem('token', response.token);
      setUser(response.user);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// src/services/authService.ts

import { apiClient } from './apiClient';
import { User } from '../types';

export const authService = {
  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },

  async getCurrentUser(): Promise<User> {
    // Esta función debería implementarse en el backend
    // Por ahora, decodificaremos el token del localStorage
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No token found');
    }
    
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        id: payload.userId,
        email: payload.email,
        name: payload.name || payload.email,
        role: payload.role
      };
    } catch {
      throw new Error('Invalid token');
    }
  },

  async refreshToken(): Promise<{ token: string }> {
    const response = await apiClient.post('/auth/refresh');
    return response.data;
  }
};

// src/services/apiClient.ts

import axios from 'axios';
import toast from 'react-hot-toast';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor para añadir token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor para manejar errores
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
      return Promise.reject(error);
    }

    const message = error.response?.data?.message || 'Error en la solicitud';
    toast.error(message);
    
    return Promise.reject(error);
  }
);

// src/services/championshipService.ts

import { apiClient } from './apiClient';
import { Championship, Standing } from '../types';

export const championshipService = {
  async getAll(): Promise<Championship[]> {
    const response = await apiClient.get('/championships');
    return response.data;
  },

  async getById(id: number): Promise<Championship> {
    const response = await apiClient.get(`/championships/${id}`);
    return response.data;
  },

  async create(data: Partial<Championship>): Promise<Championship> {
    const response = await apiClient.post('/championships', data);
    return response.data.championship;
  },

  async update(id: number, data: Partial<Championship>): Promise<Championship> {
    const response = await apiClient.put(`/championships/${id}`, data);
    return response.data.championship;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/championships/${id}`);
  },

  async generateFixtures(id: number): Promise<void> {
    await apiClient.post(`/championships/${id}/generate-fixtures`);
  },

  async getStandings(id: number): Promise<Standing[]> {
    const response = await apiClient.get(`/championships/${id}/standings`);
    return response.data.standings;
  }
};

// src/services/teamService.ts

import { apiClient } from './apiClient';
import { Team } from '../types';

export const teamService = {
  async getByChampionship(championshipId: number): Promise<Team[]> {
    const response = await apiClient.get(`/teams/championships/${championshipId}/teams`);
    return response.data;
  },

  async create(championshipId: number, data: Partial<Team>): Promise<Team> {
    const response = await apiClient.post(`/teams/championships/${championshipId}/teams`, data);
    return response.data.team;
  },

  async update(id: number, data: Partial<Team>): Promise<Team> {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data.team;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  async importCSV(championshipId: number, file: File): Promise<void> {
    const formData = new FormData();
    formData.append('csv', file);
    await apiClient.post(`/teams/championships/${championshipId}/import-csv`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
};

// src/services/matchService.ts

import { apiClient } from './apiClient';
import { Match } from '../types';

export const matchService = {
  async getByChampionship(championshipId: number): Promise<Match[]> {
    const response = await apiClient.get(`/matches/championships/${championshipId}/matches`);
    return response.data;
  },

  async getById(id: number): Promise<Match> {
    const response = await apiClient.get(`/matches/${id}`);
    return response.data;
  },

  async create(data: Partial<Match>): Promise<Match> {
    const response = await apiClient.post('/matches', data);
    return response.data.match;
  },

  async update(id: number, data: Partial<Match>): Promise<Match> {
    const response = await apiClient.put(`/matches/${id}`, data);
    return response.data.match;
  },

  async updateResult(id: number, sets: Array<{team1_games: number; team2_games: number}>): Promise<Match> {
    const response = await apiClient.post(`/matches/${id}/result`, { sets });
    return response.data.match;
  },

  async delete(id: number): Promise<void> {
    await apiClient.delete(`/matches/${id}`);
  }
};

// src/components/common/ProtectedRoute.tsx

import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LoadingSpinner } from './LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'gestor';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole && user.role !== requiredRole && user.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Acceso Denegado</h2>
          <p className="text-gray-600 mt-2">
            No tienes permisos para acceder a esta sección
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// src/components/common/LoadingSpinner.tsx

import React from 'react';

export const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );
};

// src/components/layout/Layout.tsx

import React from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

// src/components/layout/Sidebar.tsx

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  HomeIcon,
  TrophyIcon,
  UserGroupIcon,
  CalendarIcon,
  ChartBarIcon,
  BuildingOfficeIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../contexts/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Campeonatos', href: '/championships', icon: TrophyIcon },
  { name: 'Canchas', href: '/courts', icon: BuildingOfficeIcon }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-gray-900">Pádel Manager</h1>
        <p className="text-sm text-gray-600 mt-1">
          {user?.role === 'admin' ? 'Administrador' : 'Gestor'}
        </p>
      </div>

      <nav className="mt-6">
        <div className="px-3">
          {navigation.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <item.icon 
                  className={`mr-3 h-5 w-5 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} 
                />
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
};

// src/components/layout/Header.tsx

import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserCircleIcon, ArrowRightOnRectangleIcon } from '@heroicons/react/24/outline';

export const Header: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="px-6 py-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Gestión de Campeonatos de Pádel
          </h2>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <UserCircleIcon className="h-6 w-6 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">{user?.name}</p>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md"
          >
            <ArrowRightOnRectangleIcon className="h-4 w-4" />
            <span>Salir</span>
          </button>
        </div>
      </div>
    </header>
  );
};

// src/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';

export const LoginPage: React.FC = () => {
  const { login, user } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await login(email, password);
      toast.success('¡Bienvenido!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = (role: 'admin' | 'gestor') => {
    if (role === 'admin') {
      setEmail('admin@padel.com');
      setPassword('admin123');
    } else {
      setEmail('gestor@padel.com');
      setPassword('gestor123');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Pádel Championship Manager
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sistema de gestión de campeonatos de pádel
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-t-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Contraseña
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="relative block w-full px-3 py-2 border border-gray-300 rounded-b-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </button>
          </div>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Usuarios de prueba</span>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleDemoLogin('admin')}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Admin Demo
              </button>
              <button
                type="button"
                onClick={() => handleDemoLogin('gestor')}
                className="w-full inline-flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-500 hover:bg-gray-50"
              >
                Gestor Demo
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                <strong>Admin:</strong> admin@padel.com / admin123<br />
                <strong>Gestor:</strong> gestor@padel.com / gestor123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
