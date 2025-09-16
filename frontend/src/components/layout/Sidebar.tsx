import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface NavigationItem {
  name: string;
  href: string;
  icon: string;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: '🏠' },
  { name: 'Campeonatos', href: '/championships', icon: '🏆' },
  { name: 'Canchas', href: '/courts', icon: '🏟️' }
];

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  return (
    <div className="w-64 bg-white shadow-lg">
      <div className="p-6 border-b border-gray-200">
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
                  group flex items-center px-3 py-2 text-sm font-medium rounded-md mb-1 transition-colors
                  ${isActive 
                    ? 'bg-blue-100 text-blue-700' 
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }
                `}
              >
                <span className={`mr-3 text-lg ${isActive ? 'text-blue-500' : 'text-gray-400'}`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="absolute bottom-6 left-6 right-6">
        <div className="text-xs text-gray-500 text-center">
          <p>Sistema v1.0.0</p>
          <p>Release 1 (MVP)</p>
        </div>
      </div>
    </div>
  );
};
