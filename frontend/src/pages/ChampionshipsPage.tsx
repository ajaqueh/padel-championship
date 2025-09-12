// src/pages/ChampionshipsPage.tsx

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { Link } from 'react-router-dom';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { CreateChampionshipModal } from '../components/championships/CreateChampionshipModal';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  ChartBarIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export const ChampionshipsPage: React.FC = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: championships, isLoading } = useQuery(
    'championships',
    championshipService.getAll
  );

  const deleteMutation = useMutation(championshipService.delete, {
    onSuccess: () => {
      queryClient.invalidateQueries('championships');
      toast.success('Campeonato eliminado exitosamente');
    }
  });

  const generateFixturesMutation = useMutation(championshipService.generateFixtures, {
    onSuccess: () => {
      toast.success('Fixtures generados exitosamente');
    }
  });

  const handleDelete = (id: number, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el campeonato "${name}"?`)) {
      deleteMutation.mutate(id);
    }
  };

  const handleGenerateFixtures = (id: number, name: string) => {
    if (window.confirm(`¿Generar fixtures para "${name}"? Esto eliminará los partidos existentes.`)) {
      generateFixturesMutation.mutate(id);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Campeonatos</h1>
          <p className="text-gray-600 mt-1">
            Gestiona todos los campeonatos de pádel
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center space-x-2"
        >
          <PlusIcon className="h-4 w-4" />
          <span>Nuevo Campeonato</span>
        </button>
      </div>

      {championships && championships.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-md">
          <ul className="divide-y divide-gray-200">
            {championships.map((championship) => (
              <li key={championship.id}>
                <div className="px-6 py-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-medium text-gray-900">
                        {championship.name}
                      </h3>
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          championship.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : championship.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {championship.status}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                      <span>Formato: {championship.format}</span>
                      <span>Grupos: {championship.num_groups}</span>
                      <span>Creado por: {championship.created_by_name}</span>
                      <span>
                        Fecha: {new Date(championship.start_date).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Link
                      to={`/championships/${championship.id}`}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <EyeIcon className="h-5 w-5" />
                    </Link>

                    <Link
                      to={`/championships/${championship.id}/standings`}
                      className="text-green-600 hover:text-green-900"
                      title="Ver posiciones"
                    >
                      <ChartBarIcon className="h-5 w-5" />
                    </Link>

                    {championship.status === 'draft' && (
                      <button
                        onClick={() => handleGenerateFixtures(championship.id, championship.name)}
                        className="text-purple-600 hover:text-purple-900"
                        title="Generar fixtures"
                        disabled={generateFixturesMutation.isLoading}
                      >
                        <PlayIcon className="h-5 w-5" />
                      </button>
                    )}

                    <button
                      onClick={() => handleDelete(championship.id, championship.name)}
                      className="text-red-600 hover:text-red-900"
                      disabled={deleteMutation.isLoading}
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay campeonatos
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Comienza creando tu primer campeonato de pádel
          </p>
          <div className="mt-6">
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
            >
              Crear Campeonato
            </button>
          </div>
        </div>
      )}

      {showCreateModal && (
        <CreateChampionshipModal 
          onClose={() => setShowCreateModal(false)}
        />
      )}
    </div>
  );
};