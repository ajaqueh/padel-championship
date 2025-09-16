import React, { useState, useEffect } from 'react';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Championship } from '../types';

export const DashboardPage: React.FC = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchChampionships = async () => {
      try {
        const data = await championshipService.getAll();
        setChampionships(data);
      } catch (error) {
        console.error('Error fetching championships:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchChampionships();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Cargando dashboard..." />;
  }

  const activeChampionships = championships.filter(c => c.status === 'active');
  const draftChampionships = championships.filter(c => c.status === 'draft');
  const finishedChampionships = championships.filter(c => c.status === 'finished');

  const stats = [
    {
      name: 'Campeonatos Activos',
      value: activeChampionships.length,
      icon: '🏆',
      color: 'bg-blue-500'
    },
    {
      name: 'En Borrador',
      value: draftChampionships.length,
      icon: '📝',
      color: 'bg-yellow-500'
    },
    {
      name: 'Finalizados',
      value: finishedChampionships.length,
      icon: '✅',
      color: 'bg-green-500'
    },
    {
      name: 'Total',
      value: championships.length,
      icon: '📊',
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
          <div key={stat.name} className="card">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className={`p-3 rounded-md ${stat.color} text-white text-2xl`}>
                  {stat.icon}
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
        ))}
      </div>

      {/* Campeonatos Recientes */}
      <div className="card">
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Campeonatos Recientes
          </h3>
        </div>
        
        {championships.length > 0 ? (
          <div className="space-y-4">
            {championships.slice(0, 5).map((championship) => (
              <div
                key={championship.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
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
            <div className="text-6xl mb-4">🏆</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay campeonatos
            </h3>
            <p className="text-gray-500">
              Comienza creando tu primer campeonato de pádel
            </p>
          </div>
        )}
      </div>

      {/* Caso específico 18/16/10/10 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
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
  );
};