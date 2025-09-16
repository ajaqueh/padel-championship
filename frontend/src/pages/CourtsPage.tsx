	import React from 'react';

	export const CourtsPage: React.FC = () => {
	  return (
		<div className="space-y-6">
		  <div>
			<h1 className="text-3xl font-bold text-gray-900">Canchas</h1>
			<p className="text-gray-600 mt-1">
			  Gestión de canchas de pádel
			</p>
		  </div>

		  <div className="card">
			<div className="text-center py-12">
			  <div className="text-6xl mb-4">🏟️</div>
			  <h3 className="text-lg font-medium text-gray-900 mb-2">
				Gestión de Canchas
			  </h3>
			  <p className="text-gray-500">
				Funcionalidad disponible en próximas versiones
			  </p>
			</div>
		  </div>
		</div>
	  );
	};