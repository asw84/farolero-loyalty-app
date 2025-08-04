// src/pages/HomePage.tsx
import { useEffect, useState } from 'react';
import { fetchWalks } from '../api';
import WalkCard from '../components/WalkCard'; // Импортируем карточку

interface Walk {
  id: number;
  city: string;
  title: string;
  price: number;
}

const HomePage = () => {
  // ... (код с загрузкой данных остается прежним)
  const [walks, setWalks] = useState<Walk[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalks().then(data => {
        setWalks(data);
    }).finally(() => {
        setLoading(false);
    });
  }, []);

  if (loading) {
    return <div>Загрузка прогулок...</div>;
  }

  return (
    <div>
      <h1>Прогулки Farolero</h1>
      <div>
        {walks.map(walk => (
          <WalkCard key={walk.id} walk={walk} /> // Используем компонент
        ))}
      </div>
    </div>
  );
};

export default HomePage;