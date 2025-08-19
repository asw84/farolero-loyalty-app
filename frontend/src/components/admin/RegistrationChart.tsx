// frontend/src/components/admin/RegistrationChart.tsx

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
import { fetchUserRegistrationStats } from '../../api';

interface RegistrationData {
  date: string;
  count: number;
}

const RegistrationChart = () => {
  const [data, setData] = useState<RegistrationData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const stats = await fetchUserRegistrationStats();
        setData(stats);
      } catch (error) {
        console.error('Error loading registration stats:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <div>Загрузка данных о регистрациях...</div>;
  }

  return (
    <div style={{ marginBottom: '30px' }}>
      <h3>Регистрации пользователей (последние 30 дней)</h3>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="count" fill="#8884d8" name="Количество регистраций" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default RegistrationChart;