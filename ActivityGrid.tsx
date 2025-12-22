import React from 'react';
import type { ActivityWithStats } from '../types';

export const ActivityGrid: React.FC = () => {
  return (
    <div className="activity-grid">
      <div className="grid-header">Actividad</div>
      <div className="grid-header">Categoría</div>
      <div className="grid-header">Año</div>
      <div className="grid-header">Solo</div>
      <div className="grid-header">Pasivo</div>
      <div className="grid-header">Boost</div>
    </div>
  );
};