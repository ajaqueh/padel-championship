import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { championshipService } from '../services/championshipService';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { CreateChampionshipModal } from '../components/championships/CreateChampionshipModal';
import { Championship } from '../types';

export const ChampionshipsPage: React.FC = () => {
  const [championships, setChampionships] = useState<Championship[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [generatingFixturesId, setGeneratingFixturesId] = useState<number | null>(null);

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

  useEffect(() => {
    fetchChampionships();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    if (window.confirm(`¿Estás seguro de eliminar el campeonato "${name}"?`)) {
      setDeletingId(id);
      try {
        await championshipService.delete(id);
        await fetchChampionships();
      } catch (error) {
        console.error('Error deleting championship:', error);
      } finally {
        setDeletingId(null);
      }
    }
  };

  const handleGenerateFixtures = async (id: number, name: string) => {
    if (window.confirm(`¿Generar fixtures para "${name}"? Esto eliminará los partidos existentes.`)) {
      setGeneratingFixturesId(id);
      try {
        await championshipService.generateFixtures(id);
        alert('Fixtures generados exitosamente');
      } catch (error) {
        console.error('Error generating fixtures:', error);
        alert('Error al generar fixtures');
      } finally {
        setGeneratingFixturesId(null);
      }
    }
  };

  if (loading) {
    return <LoadingSpinner text="Cargando campeonatos..." />;
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
        <Button onClick={() => setShowCreateModal(true)}>
          <span className="mr-2">➕</span>
          Nuevo Campeonato
        </Button>
      </div>

      {championships.length > 0 ? (
        <div className="card">
          <div className="space-y-4">
            {championships.map((championship) => (
              <div 
                key={championship.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
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

                <div className="flex items-center space-x-2 ml-4">
                  <Link
                    to={`/championships/${championship.id}`}
                    className="text-blue-600 hover:text-blue-900 p-2"
                    title="Ver detalles"
                  >
                    👁️
                  </Link>

                  <Link
                    to={`/championships/${championship.id}/standings`}
                    className="text-green-600 hover:text-green-900 p-2"
                    title="Ver posiciones"
                  >
                    📊
                  </Link>

                  {championship.status === 'draft' && (
                    <Button
                      size="sm"
                      variant="secondary"
                      loading={generatingFixturesId === championship.id}
                      onClick={() => handleGenerateFixtures(championship.id, championship.name)}
                      title="Generar fixtures"
                    >
                      ▶️
                    </Button>
                  )}

                  <Button
                    size="sm"
                    variant="danger"
                    loading={deletingId === championship.id}
                    onClick={() => handleDelete(championship.id, championship.name)}
                    title="Eliminar"
                  >
                    🗑️
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card">
          <div className="text-6xl mb-4">🏆</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No hay campeonatos
          </h3>
          <p className="text-gray-500 mb-6">
            Comienza creando tu primer campeonato de pádel
          </p>
          <Button onClick={() => setShowCreateModal(true)}>
            Crear Campeonato
          </Button>
        </div>
      )}

      {showCreateModal && (
        <CreateChampionshipModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchChampionships();
          }}
        />
      )}
    </div>
  );
};
