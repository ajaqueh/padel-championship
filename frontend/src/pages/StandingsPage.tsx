import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Championship, Standing } from '../types';

export const StandingsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const championshipId = parseInt(id!);
  
  const [championship, setChampionship] = useState<Championship | null>(null);
  const [standings, setStandings] = useState<Standing[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [championshipData, standingsData] = await Promise.all([
          championshipService.getById(championshipId),
          championshipService.getStandings(championshipId)
        ]);
        
        setChampionship(championshipData);
        setStandings(standingsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [championshipId]);

  if (loading) {
    return <LoadingSpinner text="Cargando posiciones..." />;
  }

  const getPositionIcon = (position: number) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return position.toString();
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

      {standings.length > 0 ? (
        <div className="card">
          <div className="border-b border-gray-200 pb-4 mb-4">
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
                          <span className="text-lg">{getPositionIcon(standing.position)}</span>
                          <span className="text-gray-600">#{standing.position}</span>
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
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              <p><strong>PJ:</strong> Partidos Jugados | <strong>PG:</strong> Partidos Ganados | <strong>PP:</strong> Partidos Perdidos</p>
              <p><strong>Pts:</strong> Puntos | <strong>Sets:</strong> Sets Ganados-Perdidos | <strong>Juegos:</strong> Juegos Ganados-Perdidos | <strong>Dif:</strong> Diferencia de Juegos</p>
            </div>
          </div>

          {/* Criterios de desempate */}
          <div className="mt-4 bg-blue-50 border border-blue-200 rounded p-4">
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
        <div className="text-center py-12 card">
          <div className="text-6xl mb-4">📊</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay datos disponibles
          </h3>
          <p className="text-gray-500">
            Los standings se calcularán automáticamente cuando haya partidos finalizados
          </p>
        </div>
      )}
    </div>
  );
};
