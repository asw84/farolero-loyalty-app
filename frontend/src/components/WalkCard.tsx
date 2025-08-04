// src/components/WalkCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import './WalkCard.css';

// Интерфейс теперь снова простой
interface Walk {
  id: number;
  city: string;
  title: string;
  price: number;
}

interface WalkCardProps {
  walk: Walk;
}

const WalkCard: React.FC<WalkCardProps> = ({ walk }) => {
  return (
    <Link to={`/walk/${walk.id}`} className="walk-card-link">
      <div className="walk-card">
        <div className="walk-card-content">
          <span className="walk-card-city">{walk.city}</span>
          <h3 className="walk-card-title">{walk.title}</h3>
          <div className="walk-card-footer">
            <span className="walk-card-price">{walk.price} руб.</span>
            <span className="walk-card-details-text">Подробнее</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default WalkCard;