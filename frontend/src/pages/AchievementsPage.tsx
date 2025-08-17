// frontend/src/pages/AchievementsPage.tsx
// Страница геймификации и достижений

import React, { useState, useEffect } from 'react';
import { useUser } from '../hooks/useUser';
import {
  fetchUserAchievements,
  fetchAchievementsStats,
  fetchDailyTasks,
  fetchUserStreak,
  fetchActivityCalendar,
  performDailyCheckin,
  updateTaskProgress,
  trackActivity
} from '../api';
import './AchievementsPage.css';

interface Achievement {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  category: string;
  is_completed: boolean;
  unlocked_at?: string;
  progress_percentage: number;
  current_progress: number;
  condition_value: number;
}

interface DailyTask {
  id: number;
  code: string;
  name: string;
  description: string;
  icon: string;
  points_reward: number;
  current_progress: number;
  target_value: number;
  is_completed: boolean;
  progress_percentage: number;
}

interface ActivityDay {
  date: string;
  day_name: string;
  is_today: boolean;
  is_weekend: boolean;
  activity_level: 'none' | 'low' | 'medium' | 'high';
  activity_score: number;
  summary: {
    total_points_earned: number;
    total_actions: number;
    activity_types: string[];
  };
}

const AchievementsPage: React.FC = () => {
  const { userData, loading: userLoading } = useUser();
  
  // Состояния для данных
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementStats, setAchievementStats] = useState<any>({});
  const [dailyTasks, setDailyTasks] = useState<DailyTask[]>([]);
  const [dailyTasksStats, setDailyTasksStats] = useState<any>({});
  const [streak, setStreak] = useState<any>({});
  const [activityCalendar, setActivityCalendar] = useState<ActivityDay[]>([]);
  
  // Состояния загрузки
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Состояния активного таба
  const [activeTab, setActiveTab] = useState<'achievements' | 'daily' | 'calendar'>('daily');

  // Загрузка данных при монтировании
  useEffect(() => {
    if (userData?.telegramId && !userLoading) {
      loadAllData();
      // Автоматический ежедневный вход
      handleDailyCheckin();
    }
  }, [userData?.telegramId, userLoading]);

  const loadAllData = async () => {
    if (!userData?.telegramId) return;

    setLoading(true);
    try {
      const [achievementsData, statsData, tasksData, streakData, calendarData] = await Promise.all([
        fetchUserAchievements(userData.telegramId),
        fetchAchievementsStats(userData.telegramId),
        fetchDailyTasks(userData.telegramId),
        fetchUserStreak(userData.telegramId),
        fetchActivityCalendar(userData.telegramId, '14') // Последние 14 дней
      ]);

      if (achievementsData.success) {
        setAchievements(achievementsData.data);
      }

      if (statsData.success) {
        setAchievementStats(statsData.data);
      }

      if (tasksData.success) {
        setDailyTasks(tasksData.data.tasks);
        setDailyTasksStats({
          completed_count: tasksData.data.completed_count,
          total_count: tasksData.data.total_count,
          total_points_available: tasksData.data.total_points_available,
          total_points_earned: tasksData.data.total_points_earned
        });
      }

      if (streakData.success) {
        setStreak(streakData.data);
      }

      if (calendarData.success) {
        setActivityCalendar(calendarData.data.calendar);
      }

    } catch (error) {
      console.error('Error loading achievements data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDailyCheckin = async () => {
    if (!userData?.telegramId) return;

    try {
      const result = await performDailyCheckin(userData.telegramId);
      if (result.success) {
        console.log('Daily checkin completed:', result);
        // Трекаем активность
        await trackActivity(userData.telegramId, 'app_visit');
      }
    } catch (error) {
      console.error('Error performing daily checkin:', error);
    }
  };

  const handleTaskAction = async (taskCode: string) => {
    if (!userData?.telegramId) return;

    setRefreshing(true);
    try {
      let activityType = '';
      
      switch (taskCode) {
        case 'DAILY_VK_ACTIVITY':
          activityType = 'vk_activity';
          break;
        case 'DAILY_INSTAGRAM_ACTIVITY':
          activityType = 'instagram_activity';
          break;
        case 'DAILY_REFERRAL_SHARE':
          activityType = 'referral_share';
          break;
        case 'DAILY_WALK_VIEW':
          activityType = 'walk_view';
          break;
        default:
          // Для большинства заданий используем прямое обновление прогресса
          const result = await updateTaskProgress(userData.telegramId, taskCode, 1);
          if (result.success) {
            if (result.is_completed) {
              alert(`🎉 Задание выполнено! Получено ${result.points_earned} баллов`);
            } else {
              alert(`Прогресс: ${result.progress}/${result.target}`);
            }
            await loadAllData(); // Перезагружаем данные
          } else {
            alert(result.message || 'Ошибка выполнения задания');
          }
          return;
      }

      // Для заданий с трекингом активности
      if (activityType) {
        const result = await trackActivity(userData.telegramId, activityType);
        if (result.success) {
          const completedTasks = result.completed_details || [];
          if (completedTasks.length > 0) {
            const totalPoints = completedTasks.reduce((sum: number, task: any) => sum + (task.result.points_earned || 0), 0);
            alert(`🎉 Выполнено заданий: ${completedTasks.length}! Получено ${totalPoints} баллов`);
          } else {
            alert('Активность засчитана!');
          }
          await loadAllData();
        } else {
          alert(result.message || 'Ошибка выполнения задания');
        }
      }

    } catch (error) {
      console.error('Error handling task action:', error);
      alert('Произошла ошибка при выполнении задания');
    } finally {
      setRefreshing(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  if (userLoading || loading) {
    return (
      <div className="achievements-page">
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Загрузка достижений...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="achievements-page">
      <div className="achievements-header">
        <h1>🏆 Достижения и награды</h1>
        <button 
          className="refresh-btn" 
          onClick={refreshData}
          disabled={refreshing}
        >
          {refreshing ? '🔄' : '↻'} Обновить
        </button>
      </div>

      {/* Быстрая статистика */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-content">
            <div className="stat-number">{achievementStats.completed_achievements || 0}</div>
            <div className="stat-label">Достижений</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-content">
            <div className="stat-number">{streak.current_streak || 0}</div>
            <div className="stat-label">Дней подряд</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-number">{dailyTasksStats.completed_count || 0}/{dailyTasksStats.total_count || 0}</div>
            <div className="stat-label">Заданий сегодня</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">💎</div>
          <div className="stat-content">
            <div className="stat-number">{achievementStats.total_points_from_achievements || 0}</div>
            <div className="stat-label">Баллов за достижения</div>
          </div>
        </div>
      </div>

      {/* Навигация по табам */}
      <div className="tabs-navigation">
        <button 
          className={`tab-button ${activeTab === 'daily' ? 'active' : ''}`}
          onClick={() => setActiveTab('daily')}
        >
          📅 Ежедневные задания
        </button>
        <button 
          className={`tab-button ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Достижения
        </button>
        <button 
          className={`tab-button ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          📊 Календарь активности
        </button>
      </div>

      {/* Контент табов */}
      <div className="tab-content">
        {activeTab === 'daily' && (
          <div className="daily-tasks-section">
            <div className="section-header">
              <h2>📅 Ежедневные задания</h2>
              <div className="tasks-progress">
                Выполнено: {dailyTasksStats.completed_count}/{dailyTasksStats.total_count} 
                {dailyTasksStats.total_points_available > 0 && (
                  <span className="available-points">
                    (+{dailyTasksStats.total_points_available} баллов доступно)
                  </span>
                )}
              </div>
            </div>

            <div className="tasks-grid">
              {dailyTasks.map((task) => (
                <div key={task.id} className={`task-card ${task.is_completed ? 'completed' : ''}`}>
                  <div className="task-icon">{task.icon}</div>
                  <div className="task-content">
                    <h3>{task.name}</h3>
                    <p>{task.description}</p>
                    
                    <div className="task-progress">
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${task.progress_percentage}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">
                        {task.current_progress}/{task.target_value}
                      </span>
                    </div>
                    
                    <div className="task-reward">+{task.points_reward} баллов</div>
                  </div>
                  
                  {!task.is_completed && (
                    <button 
                      className="task-action-btn"
                      onClick={() => handleTaskAction(task.code)}
                      disabled={refreshing}
                    >
                      {refreshing ? '...' : 'Выполнить'}
                    </button>
                  )}
                  
                  {task.is_completed && (
                    <div className="completed-badge">✅ Готово</div>
                  )}
                </div>
              ))}
            </div>

            {/* Информация о стрике */}
            {streak && (
              <div className="streak-info">
                <h3>🔥 Серия активности</h3>
                <div className="streak-stats">
                  <div className="streak-current">
                    Текущая серия: <strong>{streak.current_streak || 0} дней</strong>
                  </div>
                  <div className="streak-best">
                    Лучшая серия: <strong>{streak.longest_streak || 0} дней</strong>
                  </div>
                  <div className="streak-total">
                    Всего активных дней: <strong>{streak.total_days_active || 0}</strong>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'achievements' && (
          <div className="achievements-section">
            <div className="section-header">
              <h2>🏆 Достижения</h2>
              <div className="achievements-progress">
                Прогресс: {achievementStats.completion_rate || 0}% 
                ({achievementStats.completed_achievements || 0}/{achievementStats.total_achievements || 0})
              </div>
            </div>

            <div className="achievements-grid">
              {achievements.map((achievement) => (
                <div key={achievement.id} className={`achievement-card ${achievement.is_completed ? 'completed' : 'in-progress'}`}>
                  <div className="achievement-icon">{achievement.icon}</div>
                  <div className="achievement-content">
                    <h3>{achievement.name}</h3>
                    <p>{achievement.description}</p>
                    
                    {!achievement.is_completed && (
                      <div className="achievement-progress">
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${achievement.progress_percentage}%` }}
                          ></div>
                        </div>
                        <span className="progress-text">
                          {achievement.current_progress}/{achievement.condition_value}
                        </span>
                      </div>
                    )}
                    
                    <div className="achievement-reward">+{achievement.points_reward} баллов</div>
                    <div className="achievement-category">{achievement.category}</div>
                  </div>
                  
                  {achievement.is_completed && (
                    <div className="completed-badge">
                      ✅ Получено
                      {achievement.unlocked_at && (
                        <div className="unlock-date">
                          {new Date(achievement.unlocked_at).toLocaleDateString('ru-RU')}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-section">
            <div className="section-header">
              <h2>📊 Календарь активности</h2>
              <p>Ваша активность за последние 14 дней</p>
            </div>

            <div className="activity-calendar">
              <div className="calendar-header">
                <div className="calendar-legend">
                  <span className="legend-item">
                    <span className="legend-color none"></span> Нет активности
                  </span>
                  <span className="legend-item">
                    <span className="legend-color low"></span> Низкая
                  </span>
                  <span className="legend-item">
                    <span className="legend-color medium"></span> Средняя
                  </span>
                  <span className="legend-item">
                    <span className="legend-color high"></span> Высокая
                  </span>
                </div>
              </div>
              
              <div className="calendar-grid">
                {activityCalendar.map((day) => (
                  <div 
                    key={day.date} 
                    className={`calendar-day ${day.activity_level} ${day.is_today ? 'today' : ''} ${day.is_weekend ? 'weekend' : ''}`}
                    title={`${day.date} (${day.day_name}): ${day.summary.total_points_earned} баллов, ${day.summary.total_actions} действий`}
                  >
                    <div className="day-date">{new Date(day.date).getDate()}</div>
                    <div className="day-name">{day.day_name}</div>
                    {day.activity_score > 0 && (
                      <div className="day-score">{day.activity_score}</div>
                    )}
                    {day.summary.activity_types.length > 0 && (
                      <div className="day-activities">
                        {day.summary.activity_types.join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="activity-summary">
              <h3>📈 Сводка активности</h3>
              <div className="summary-stats">
                <div className="summary-item">
                  <span className="summary-label">Активных дней:</span>
                  <span className="summary-value">
                    {activityCalendar.filter(day => day.activity_score > 0).length}/{activityCalendar.length}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Всего баллов:</span>
                  <span className="summary-value">
                    {activityCalendar.reduce((sum, day) => sum + day.summary.total_points_earned, 0)}
                  </span>
                </div>
                <div className="summary-item">
                  <span className="summary-label">Всего действий:</span>
                  <span className="summary-value">
                    {activityCalendar.reduce((sum, day) => sum + day.summary.total_actions, 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AchievementsPage;
