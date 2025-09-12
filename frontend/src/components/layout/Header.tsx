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