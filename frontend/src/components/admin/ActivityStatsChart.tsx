// frontend/src/components/admin/ActivityStatsChart.tsx

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { fetchActivityStats } from '../../api';

interface ActivityData {
  activity_type: string;
  count: number;
  total_points_earned: number;
  total_points_spent: number;
}

const ActivityStatsChart = () => {
  const [data, setData] = useState<ActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await fetchActivityStats();
        setData(stats);
      } catch (error) {
        console.error('Error loading activity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Загрузка данных об активности...</div>;
  }

  // Форматируем данные для отображения
  const chartData = data.map(item => ({
    activity_type: item.activity_type,
    count: item.count,
    points_earned: item.total_points_earned,
    points_spent: item.total_points_spent
  }));

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Статистика активности (последние 30 дней)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="activity_type" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Количество действий" />
            <Bar dataKey="points_earned" fill="#82ca9d" name="Баллы заработаны" />
            <Bar dataKey="points_spent" fill="#ffc658" name="Баллы потрачены" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ActivityStatsChart;