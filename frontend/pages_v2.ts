// src/pages/DashboardPage.tsx

import React from 'react';
import { useQuery } from 'react-query';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  TrophyIcon, 
  UserGroupIcon, 
  CalendarIcon,
  ChartBarIcon 
} from '@heroicons/react/24/outline';

export const DashboardPage: React.FC = () => {
  const { data: championships, isLoading } = useQuery(
    'championships',
    championshipService.getAll
  );

  if (isLoading) {
    return <LoadingSpinner />;
  }

  const activeChampionships = championships?.filter(c => c.status === 'active') || [];
  const draftChampionships = championships?.filter(c => c.status === 'draft') || [];
  const finishedChampionships = championships?.filter(c => c.status === 'finished') || [];

  const stats = [
    {
      name: 'Campeonatos Activos',
      value: activeChampionships.length,
      icon: TrophyIcon,
      color: 'bg-blue-500'
    },
    {
      name: 'Campeonatos en Borrador',
      value: draftChampionships.length,
      icon: CalendarIcon,
      color: 'bg-yellow-500'
    },
    {
      name: 'Campeonatos Finalizados',
      value: finishedChampionships.length,
      icon: ChartBarIcon,
      color: 'bg-green-500'
    },
    {
      name: 'Total Campeonatos',
      value: championships?.length || 0,
      icon: UserGroupIcon,
      color: 'bg-purple-500'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Resumen general del sistema de campeonatos de pádel
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.name}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`p-3 rounded-md ${stat.color}`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Campeonatos Recientes */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Campeonatos Recientes
          </h3>
        </div>
        <div className="px-6 py-4">
          {championships && championships.length > 0 ? (
            <div className="space-y-4">
              {championships.slice(0, 5).map((championship) => (
                <div
                  key={championship.id}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {championship.name}
                    </h4>
                    <p className="text-sm text-gray-500">
                      Formato: {championship.format} • Grupos: {championship.num_groups}
                    </p>
                    <p className="text-xs text-gray-400">
                      Creado: {new Date(championship.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
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
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrophyIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">
                No hay campeonatos
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                Comienza creando tu primer campeonato
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Caso específico 18/16/10/10 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg">
        <div className="px-6 py-4">
          <h3 className="text-lg font-medium text-blue-900 mb-2">
            🎯 Caso de Prueba Específico
          </h3>
          <p className="text-blue-800 text-sm mb-4">
            Se ha configurado un campeonato de ejemplo con el escenario específico de desempate:
            <strong> equipos con 18, 16, 10, 10 juegos ganados</strong>
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="bg-white p-3 rounded-md">
              <div className="font-semibold text-blue-900">Alpha</div>
              <div className="text-blue-700">18 juegos • 1º lugar</div>
            </div>
            <div className="bg-white p-3 rounded-md">
              <div className="font-semibold text-blue-900">Beta</div>
              <div className="text-blue-700">16 juegos • 2º lugar</div>
            </div>
            <div className="bg-white p-3 rounded-md">
              <div className="font-semibold text-blue-900">Delta</div>
              <div className="text-blue-700">10 juegos • 3º lugar</div>
            </div>
            <div className="bg-white p-3 rounded-md">
              <div className="font-semibold text-blue-900">Gamma</div>
              <div className="text-blue-700">10 juegos • 4º lugar</div>
            </div>
          </div>
          <p className="text-xs text-blue-600 mt-3">
            * Delta está por encima de Gamma por haber ganado el head-to-head entre ambos equipos empatados en juegos
          </p>
        </div>
      </div>
    </div>
  );
};

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

// src/pages/StandingsPage.tsx

// src/pages/StandingsPage.tsx

import React from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from 'react-query';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { 
  TrophyIcon, 
  ChartBarIcon,
  ArrowUpIcon,
  ArrowDownIcon
} from '@heroicons/react/24/outline';

export const StandingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const championshipId = parseInt(id!);

  const { data: championship, isLoading: isLoadingChampionship } = useQuery(
    ['championship', championshipId],
    () => championshipService.getById(championshipId)
  );

  const { data: standings, isLoading: isLoadingStandings } = useQuery(
    ['standings', championshipId],
    () => championshipService.getStandings(championshipId)
  );

  if (isLoadingChampionship || isLoadingStandings) {
    return <LoadingSpinner />;
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return <TrophyIcon className="h-5 w-5 text-yellow-500" />;
    if (position === 2) return <div className="h-5 w-5 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold">2</div>;
    if (position === 3) return <div className="h-5 w-5 bg-amber-600 rounded-full flex items-center justify-center text-xs font-bold text-white">3</div>;
    return <span className="text-gray-500 font-semibold">{position}</span>;
  };

  const getPositionRowClass = (position: number) => {
    if (position === 1) return 'bg-yellow-50 border-yellow-200';
    if (position === 2) return 'bg-gray-50 border-gray-200';
    if (position === 3) return 'bg-amber-50 border-amber-200';
    return 'bg-white border-gray-200';
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Tabla de Posiciones
        </h1>
        <p className="text-gray-600 mt-1">
          {championship?.name} - {championship?.format}
        </p>
      </div>

      {/* Caso específico destacado */}
      {championship?.name.includes('18/16/10/10') && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-medium text-blue-900 mb-3">
            🎯 Caso de Prueba Específico: Desempate 18/16/10/10
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <p className="font-semibold text-blue-900">Escenario:</p>
              <ul className="text-blue-800 space-y-1">
                <li>• Alpha: 18 juegos ganados</li>
                <li>• Beta: 16 juegos ganados</li>
                <li>• Gamma y Delta: 10 juegos ganados cada uno</li>
              </ul>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-blue-900">Criterio de desempate aplicado:</p>
              <p className="text-blue-800">
                Delta supera a Gamma por <strong>head-to-head</strong> 
                (Delta ganó el partido directo entre ambos equipos empatados)
              </p>
            </div>
          </div>
        </div>
      )}

      {standings && standings.length > 0 ? (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">
                Posiciones Actuales
              </h3>
              <div className="text-sm text-gray-500">
                Actualizado: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Equipo
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PJ
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PG
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    PP
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pts
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Sets
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Juegos
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dif
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {standings.map((standing, index) => {
                  const gamesDiff = standing.games_won - standing.games_lost;
                  const setsDiff = standing.sets_won - standing.sets_lost;
                  
                  return (
                    <tr 
                      key={standing.id} 
                      className={`${getPositionRowClass(standing.position)} border-l-4`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center space-x-2">
                          {getPositionIcon(standing.position)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {standing.team_name}
                          </div>
                          <div className="text-xs text-gray-500">
                            {standing.player1_name} / {standing.player2_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {standing.matches_played}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {standing.matches_won}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        {standing.matches_lost}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className="font-semibold text-blue-600">
                          {standing.points}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                        <div>{standing.sets_won}-{standing.sets_lost}</div>
                        {setsDiff !== 0 && (
                          <div className={`text-xs ${setsDiff > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ({setsDiff > 0 ? '+' : ''}{setsDiff})
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <div className="font-semibold">
                          {standing.games_won}-{standing.games_lost}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                        <span className={`font-medium ${
                          gamesDiff > 0 ? 'text-green-600' : 
                          gamesDiff < 0 ? 'text-red-600' : 'text-gray-500'
                        }`}>
                          {gamesDiff > 0 ? '+' : ''}{gamesDiff}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Leyenda */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>PJ:</strong> Partidos Jugados | <strong>PG:</strong> Partidos Ganados | <strong>PP:</strong> Partidos Perdidos</p>
              <p><strong>Pts:</strong> Puntos | <strong>Sets:</strong> Sets Ganados-Perdidos | <strong>Juegos:</strong> Juegos Ganados-Perdidos | <strong>Dif:</strong> Diferencia de Juegos</p>
            </div>
          </div>

          {/* Criterios de desempate */}
          <div className="px-6 py-4 bg-blue-50 border-t border-blue-200">
            <h4 className="text-sm font-semibold text-blue-900 mb-2">Criterios de Desempate (en orden):</h4>
            <div className="text-xs text-blue-800 space-y-1">
              <p>1. Puntos obtenidos</p>
              <p>2. Partidos ganados</p>
              {championship?.format === 'americano' && <p>3. Total de juegos ganados (formato americano)</p>}
              <p>4. Resultado directo (head-to-head) entre equipos empatados</p>
              <p>5. Diferencia de juegos (juegos ganados - juegos perdidos)</p>
              <p>6. Mayor número de sets ganados</p>
              <p>7. Diferencia de sets</p>
              <p>8. En caso de empate total: partido de desempate o sorteo</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow sm:rounded-lg">
          <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No hay datos disponibles
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Los standings se calcularán automáticamente cuando haya partidos finalizados
          </p>
        </div>
      )}
    </div>
  );
};

// src/components/championships/CreateChampionshipModal.tsx

import React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from 'react-query';
import { championshipService } from '../../services/championshipService';
import { XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface CreateChampionshipModalProps {
  onClose: () => void;
}

interface FormData {
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: string;
  end_date?: string;
  num_groups: number;
  points_win: number;
  points_loss: number;
}

export const CreateChampionshipModal: React.FC<CreateChampionshipModalProps> = ({
  onClose
}) => {
  const queryClient = useQueryClient();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch
  } = useForm<FormData>({
    defaultValues: {
      format: 'liga',
      num_groups: 1,
      points_win: 3,
      points_loss: 0
    }
  });

  const createMutation = useMutation(championshipService.create, {
    onSuccess: () => {
      queryClient.invalidateQueries('championships');
      toast.success('Campeonato creado exitosamente');
      onClose();
    }
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  const watchedFormat = watch('format');

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Crear Nuevo Campeonato
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Nombre del Campeonato
            </label>
            <input
              type="text"
              {...register('name', { required: 'El nombre es requerido' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Formato
            </label>
            <select
              {...register('format', { required: 'El formato es requerido' })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="liga">Liga (Round-Robin)</option>
              <option value="torneo">Torneo (Fase de grupos + Eliminatorias)</option>
              <option value="americano">Americano (Todos contra todos)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <input
                type="date"
                {...register('start_date', { required: 'La fecha es requerida' })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              {errors.start_date && (
                <p className="mt-1 text-sm text-red-600">{errors.start_date.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Fecha de Fin (Opcional)
              </label>
              <input
                type="date"
                {...register('end_date')}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Número de Grupos
            </label>
            <input
              type="number"
              min="1"
              {...register('num_groups', { 
                required: 'El número de grupos es requerido',
                min: { value: 1, message: 'Debe ser al menos 1' }
              })}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
            {errors.num_groups && (
              <p className="mt-1 text-sm text-red-600">{errors.num_groups.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Puntos por Victoria
              </label>
              <input
                type="number"
                min="0"
                {...register('points_win', { 
                  required: 'Los puntos por victoria son requeridos',
                  min: { value: 0, message: 'Debe ser 0 o mayor' }
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Puntos por Derrota
              </label>
              <input
                type="number"
                min="0"
                {...register('points_loss', { 
                  min: { value: 0, message: 'Debe ser 0 o mayor' }
                })}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Información adicional según el formato */}
          {watchedFormat && (
            <div className="bg-blue-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-blue-900 mb-1">
                Sobre el formato {watchedFormat}:
              </h4>
              <p className="text-sm text-blue-800">
                {watchedFormat === 'liga' && 
                  'Todos los equipos se enfrentan una vez. Ideal para campeonatos regulares.'
                }
                {watchedFormat === 'torneo' && 
                  'Fase de grupos seguida de eliminación directa. Formato tradicional de torneos.'
                }
                {watchedFormat === 'americano' && 
                  'El ranking se basa en total de juegos ganados. Aplicación de reglas especiales de desempate.'
                }
              </p>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isLoading ? 'Creando...' : 'Crear Campeonato'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};