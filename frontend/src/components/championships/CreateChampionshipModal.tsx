import React, { useState } from 'react';
import { championshipService } from '../../services/championshipService';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';

interface CreateChampionshipModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  name: string;
  format: 'liga' | 'torneo' | 'americano';
  start_date: string;
  end_date: string;
  num_groups: number;
  points_win: number;
  points_loss: number;
}

export const CreateChampionshipModal: React.FC<CreateChampionshipModalProps> = ({
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    format: 'liga',
    start_date: '',
    end_date: '',
    num_groups: 1,
    points_win: 3,
    points_loss: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
	setLoading(true);
		setError('');

		try {
		  await championshipService.create(formData);
		  onSuccess();
		} catch (error: any) {
		  setError(error.response?.data?.message || 'Error al crear campeonato');
		} finally {
		  setLoading(false);
		}
	  };

	  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const { name, value } = e.target;
		setFormData(prev => ({
		  ...prev,
		  [name]: name === 'num_groups' || name === 'points_win' || name === 'points_loss' 
			? parseInt(value) || 0 
			: value
		}));
	  };

	  return (
		<Modal
		  isOpen={true}
		  onClose={onClose}
		  title="Crear Nuevo Campeonato"
		  size="lg"
		>
		  <form onSubmit={handleSubmit} className="space-y-4">
			{error && (
			  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
				{error}
			  </div>
			)}

			<div>
			  <label className="block text-sm font-medium text-gray-700 mb-1">
				Nombre del Campeonato
			  </label>
			  <input
				type="text"
				name="name"
				required
				value={formData.name}
				onChange={handleChange}
				className="input"
				placeholder="Ej: Liga de Pádel Verano 2024"
			  />
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-700 mb-1">
				Formato
			  </label>
			  <select
				name="format"
				value={formData.format}
				onChange={handleChange}
				className="input"
			  >
				<option value="liga">Liga (Round-Robin)</option>
				<option value="torneo">Torneo (Fase de grupos + Eliminatorias)</option>
				<option value="americano">Americano (Todos contra todos)</option>
			  </select>
			</div>

			<div className="grid grid-cols-2 gap-4">
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
				  Fecha de Inicio
				</label>
				<input
				  type="date"
				  name="start_date"
				  required
				  value={formData.start_date}
				  onChange={handleChange}
				  className="input"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
				  Fecha de Fin (Opcional)
				</label>
				<input
				  type="date"
				  name="end_date"
				  value={formData.end_date}
				  onChange={handleChange}
				  className="input"
				/>
			  </div>
			</div>

			<div>
			  <label className="block text-sm font-medium text-gray-700 mb-1">
				Número de Grupos
			  </label>
			  <input
				type="number"
				name="num_groups"
				min="1"
				required
				value={formData.num_groups}
				onChange={handleChange}
				className="input"
			  />
			</div>

			<div className="grid grid-cols-2 gap-4">
			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
				  Puntos por Victoria
				</label>
				<input
				  type="number"
				  name="points_win"
				  min="0"
				  required
				  value={formData.points_win}
				  onChange={handleChange}
				  className="input"
				/>
			  </div>

			  <div>
				<label className="block text-sm font-medium text-gray-700 mb-1">
				  Puntos por Derrota
				</label>
				<input
				  type="number"
				  name="points_loss"
				  min="0"
				  value={formData.points_loss}
				  onChange={handleChange}
				  className="input"
				/>
			  </div>
			</div>

			{/* Información adicional según el formato */}
			{formData.format && (
			  <div className="bg-blue-50 p-4 rounded-md">
				<h4 className="text-sm font-medium text-blue-900 mb-2">
				  Sobre el formato {formData.format}:
				</h4>
				<p className="text-sm text-blue-800">
				  {formData.format === 'liga' && 
					'Todos los equipos se enfrentan una vez. Ideal para campeonatos regulares.'
				  }
				  {formData.format === 'torneo' && 
					'Fase de grupos seguida de eliminación directa. Formato tradicional de torneos.'
				  }
				  {formData.format === 'americano' && 
					'El ranking se basa en total de juegos ganados. Aplicación de reglas especiales de desempate.'
				  }
				</p>
			  </div>
			)}

			<div className="flex justify-end space-x-3 pt-4">
			  <Button
				type="button"
				variant="secondary"
				onClick={onClose}
			  >
				Cancelar
			  </Button>
			  <Button
				type="submit"
				loading={loading}
			  >
				Crear Campeonato
			  </Button>
			</div>
		  </form>
		</Modal>
	  );
	};