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