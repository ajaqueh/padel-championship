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