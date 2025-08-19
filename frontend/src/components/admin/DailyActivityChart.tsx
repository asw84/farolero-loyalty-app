// frontend/src/components/admin/DailyActivityChart.tsx

import { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { fetchDailyActivityStats } from '../../api';

interface DailyActivityData {
  date: string;
  activity_count: number;
  points_earned: number;
  points_spent: number;
}

const DailyActivityChart = () => {
  const [data, setData] = useState<DailyActivityData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await fetchDailyActivityStats();
        setData(stats);
      } catch (error) {
        console.error('Error loading daily activity stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Загрузка данных о ежедневной активности...</div>;
  }

  // Форматируем дату для отображения
  const chartData = data.map(item => ({
    ...item,
    formattedDate: new Date(item.date).toLocaleDateString('ru-RU', { 
      day: 'numeric', 
      month: 'short' 
    })
  }));

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Ежедневная активность (последние 7 дней)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="formattedDate" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="activity_count" 
              stroke="#8884d8" 
              name="Количество действий" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="points_earned" 
              stroke="#82ca9d" 
              name="Баллы заработаны" 
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey="points_spent" 
              stroke="#ffc658" 
              name="Баллы потрачены" 
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default DailyActivityChart;