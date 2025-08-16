// frontend/src/pages/ReferralPage.tsx
// ЧИСТАЯ РЕФЕРАЛЬНАЯ СТРАНИЦА БЕЗ БЕСКОНЕЧНЫХ ЦИКЛОВ

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import './ReferralPage.css';

// API Base URL из переменных окружения
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://api.5425685-au70735.twc1.net';

interface ReferralStats {
  referralCode: string | null;
  totalReferrals: number;
  totalEarned: number;
  recentReferrals: Array<{
    referee_telegram_id: string;
    activated_at: string;
    bonus_amount: number;
  }>;
}

interface QRCodeResponse {
  success: boolean;
  qrCode: string;
  referralUrl: string;
}

const ReferralPage: React.FC = () => {
  const { user } = useTelegram();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [referralUrl, setReferralUrl] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState(false);

  // Мемоизация стабильного telegramId
  const telegramId = useMemo(() => user?.id, [user?.id]);

  // 🔧 ИСПРАВЛЕНИЕ: Убираем зависимости из useCallback для предотвращения пересоздания
  const loadQRCode = useCallback(async (referralCode: string) => {
    try {
      console.log(`[ReferralPage] 📱 Загружаю QR-код для: ${referralCode}`);
      const response = await fetch(`${API_BASE_URL}/api/referral/qr/${referralCode}?style=styled`);
      const data: QRCodeResponse = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
        console.log('[ReferralPage] ✅ QR-код загружен');
      } else {
        console.warn('[ReferralPage] ⚠️ QR-код не удалось загрузить');
      }
    } catch (err) {
      console.error('[ReferralPage] ❌ Ошибка загрузки QR-кода:', err);
    }
  }, []); // 🔧 БЕЗ зависимостей

  // Мемоизация генерации реферального кода (БЕЗ рекурсивного вызова)
  const generateReferralCode = useCallback(async () => {
    if (!telegramId) return null;

    try {
      console.log('[ReferralPage] 🔗 Генерирую реферальный код');
      const response = await fetch(`${API_BASE_URL}/api/referral/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId }),
      });

      const data = await response.json();

      if (data.success) {
        const newReferralUrl = `https://t.me/farolero_bot?start=ref_${data.referralCode}`;
        setReferralUrl(newReferralUrl);
        await loadQRCode(data.referralCode);
        console.log('[ReferralPage] ✅ Реферальный код создан');
        
        // Возвращаем данные для обновления статистики
        return {
          referralCode: data.referralCode,
          totalReferrals: 0,
          totalEarned: 0,
          recentReferrals: []
        };
      } else {
        setError('Ошибка создания реферального кода');
        return null;
      }
    } catch (err) {
      console.error('[ReferralPage] ❌ Ошибка генерации кода:', err);
      setError('Ошибка создания реферального кода');
      return null;
    }
  }, [telegramId, loadQRCode]);

  // Мемоизация загрузки данных рефералов (БЕЗ рекурсии)
  const loadReferralData = useCallback(async () => {
    if (!telegramId) return;

    try {
      console.log(`[ReferralPage] 📊 Загружаю данные рефералов для: ${telegramId}`);
      setLoading(true);
      setError('');

      // Получаем статистику рефералов
      const statsResponse = await fetch(`${API_BASE_URL}/api/referral/stats/${telegramId}`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        const referralStats = statsData.stats;
        setStats(referralStats);

        // Если у пользователя нет кода, создаем его
        if (!referralStats.referralCode) {
          console.log('[ReferralPage] 🆕 Реферальный код отсутствует, создаю новый');
          const newStats = await generateReferralCode();
          if (newStats) {
            setStats({ ...referralStats, ...newStats });
          }
        } else {
          // Устанавливаем URL и загружаем QR-код
          const existingUrl = `https://t.me/farolero_bot?start=ref_${referralStats.referralCode}`;
          setReferralUrl(existingUrl);
          await loadQRCode(referralStats.referralCode);
          console.log('[ReferralPage] ✅ Данные рефералов загружены');
        }
      } else {
        setError('Ошибка при загрузке данных');
      }
    } catch (err) {
      console.error('[ReferralPage] ❌ Ошибка загрузки данных рефералов:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  }, [generateReferralCode, loadQRCode]);

  // Функция для повторной попытки (только при ошибке)
  const retryLoad = useCallback(() => {
    if (telegramId) {
      setStats(null); // Сбрасываем stats для новой загрузки
      loadReferralData();
    }
  }, [telegramId, loadReferralData]);

  // 🔧 ИСПРАВЛЕНИЕ: useEffect с правильными зависимостями
  useEffect(() => {
    if (telegramId && !stats) { // 🔧 Добавляем проверку !stats для предотвращения повторных загрузок
      loadReferralData();
    }
  }, [telegramId]); // 🔧 УБИРАЕМ loadReferralData из зависимостей!

  // Мемоизация копирования в буфер обмена
  const copyToClipboard = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
      console.log('[ReferralPage] 📋 Ссылка скопирована в буфер обмена');
    } catch (err) {
      console.error('[ReferralPage] ❌ Ошибка копирования:', err);
    }
  }, [referralUrl]);

  // Мемоизация функции поделиться
  const shareReferralLink = useCallback(() => {
    if (navigator.share) {
      navigator.share({
        title: 'Присоединяйся к Farolero!',
        text: 'Получи бонусные баллы при регистрации по моей ссылке!',
        url: referralUrl,
      });
      console.log('[ReferralPage] 📤 Вызван системный диалог "Поделиться"');
    } else {
      copyToClipboard();
    }
  }, [referralUrl, copyToClipboard]);

  if (loading) {
    return (
      <div className="referral-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка реферальных данных...</p>
          <small>Telegram ID: {telegramId || 'не определен'}</small>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="referral-page">
        <div className="error-message">
          <h3>Ошибка</h3>
          <p>{error}</p>
          <button onClick={retryLoad} className="retry-button">
            Попробовать снова
          </button>
          <small>Debug: Telegram ID = {telegramId}</small>
        </div>
      </div>
    );
  }

  return (
    <div className="referral-page">
      <div className="referral-header">
        <h1>🎁 Реферальная программа</h1>
        <p>Приглашай друзей и получай бонусные баллы!</p>
      </div>

      <div className="referral-stats">
        <div className="stat-card">
          <div className="stat-number">{stats?.totalReferrals || 0}</div>
          <div className="stat-label">Приглашено друзей</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{stats?.totalEarned || 0}</div>
          <div className="stat-label">Заработано баллов</div>
        </div>
      </div>

      <div className="referral-share">
        <h3>Ваша реферальная ссылка:</h3>
        
        {qrCode && (
          <div className="qr-code-container">
            <img src={qrCode} alt="QR код для реферальной ссылки" className="qr-code" />
            <p className="qr-hint">Покажите QR-код друзьям для быстрого перехода</p>
          </div>
        )}

        <div className="link-container">
          <input 
            type="text" 
            value={referralUrl} 
            readOnly 
            className="referral-link-input"
          />
          <button 
            onClick={copyToClipboard} 
            className={`copy-button ${copySuccess ? 'success' : ''}`}
          >
            {copySuccess ? '✓ Скопировано' : '📋 Копировать'}
          </button>
        </div>

        <button onClick={shareReferralLink} className="share-button">
          📤 Поделиться ссылкой
        </button>
      </div>

      <div className="referral-info">
        <h3>💰 Как это работает?</h3>
        <div className="info-steps">
          <div className="step">
            <div className="step-number">1</div>
            <div className="step-text">
              <strong>Поделитесь ссылкой</strong><br />
              Отправьте друзьям свою реферальную ссылку
            </div>
          </div>
          <div className="step">
            <div className="step-number">2</div>
            <div className="step-text">
              <strong>Друг регистрируется</strong><br />
              Ваш друг переходит по ссылке и регистрируется
            </div>
          </div>
          <div className="step">
            <div className="step-number">3</div>
            <div className="step-text">
              <strong>Получаете бонусы</strong><br />
              Вы получаете 50 баллов, друг получает 20 баллов
            </div>
          </div>
        </div>
      </div>

      {stats?.recentReferrals && stats.recentReferrals.length > 0 && (
        <div className="recent-referrals">
          <h3>📊 Последние приглашения</h3>
          <div className="referrals-list">
            {stats.recentReferrals.map((referral, index) => (
              <div key={index} className="referral-item">
                <div className="referral-user">
                  Пользователь #{referral.referee_telegram_id.slice(-4)}
                </div>
                <div className="referral-date">
                  {new Date(referral.activated_at).toLocaleDateString('ru-RU')}
                </div>
                <div className="referral-bonus">
                  +{referral.bonus_amount} баллов
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralPage;