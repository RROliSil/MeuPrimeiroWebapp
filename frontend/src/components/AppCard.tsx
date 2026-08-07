import React, { useState } from 'react';
import type { AppItem } from '../types/app';

interface AppCardProps {
  app: AppItem;
  index: number;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDrop: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  onDragEnd: () => void;
  isDragging?: boolean;
}

export const AppCard: React.FC<AppCardProps> = ({
  app,
  index,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
}) => {
  const [imgError, setImgError] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    // Evita abrir o link se o usuário acabou de arrastar o card
    e.preventDefault();
    window.open(app.url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      className={`app-card ${isDragging ? 'dragging' : ''}`}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragOver={(e) => onDragOver(e, index)}
      onDrop={(e) => onDrop(e, index)}
      onDragEnd={onDragEnd}
      onClick={handleClick}
      title={`Clique para abrir ${app.name} (${app.url})`}
    >
      <div className="app-card-drag-indicator" title="Arraste para organizar">
        ⋮⋮
      </div>
      <div className="app-icon-wrapper">
        {!imgError ? (
          <img
            src={app.logo}
            alt={app.name}
            className="app-icon-img"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="app-icon-fallback">
            {app.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <span className="app-name">{app.name}</span>
    </div>
  );
};
