// frontend/src/pages/ReferralPage.tsx
// Страница реферальной системы

import React, { useState, useEffect } from 'react';
import { useTelegram } from '../hooks/useTelegram';
import './ReferralPage.css';

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

  useEffect(() => {
    if (user?.id) {
      loadReferralData();
    }
  }, [user]);

  const loadReferralData = async () => {
    try {
      setLoading(true);
      setError('');

      // Получаем статистику рефералов
      const statsResponse = await fetch(`/api/referral/stats/${user?.id}`);
      const statsData = await statsResponse.json();

      if (statsData.success) {
        setStats(statsData.stats);

        // Если у пользователя нет кода, создаем его
        if (!statsData.stats.referralCode) {
          await generateReferralCode();
        } else {
          setReferralUrl(`https://t.me/farolero_bot?start=ref_${statsData.stats.referralCode}`);
          await loadQRCode(statsData.stats.referralCode);
        }
      } else {
        setError('Ошибка при загрузке данных');
      }
    } catch (err) {
      console.error('Ошибка загрузки данных рефералов:', err);
      setError('Ошибка подключения к серверу');
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    try {
      const response = await fetch('/api/referral/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ telegramId: user?.id }),
      });

      const data = await response.json();

      if (data.success) {
        setReferralUrl(data.referralUrl);
        await loadQRCode(data.referralCode);
        // Перезагружаем статистику
        await loadReferralData();
      } else {
        setError('Ошибка создания реферального кода');
      }
    } catch (err) {
      console.error('Ошибка генерации кода:', err);
      setError('Ошибка создания реферального кода');
    }
  };

  const loadQRCode = async (referralCode: string) => {
    try {
      const response = await fetch(`/api/referral/qr/${referralCode}?style=styled`);
      const data: QRCodeResponse = await response.json();

      if (data.success) {
        setQrCode(data.qrCode);
      }
    } catch (err) {
      console.error('Ошибка загрузки QR-кода:', err);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Ошибка копирования:', err);
    }
  };

  const shareReferralLink = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Присоединяйся к Farolero!',
        text: 'Получи бонусные баллы при регистрации по моей ссылке!',
        url: referralUrl,
      });
    } else {
      copyToClipboard();
    }
  };

  if (loading) {
    return (
      <div className="referral-page">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Загрузка...</p>
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
          <button onClick={loadReferralData} className="retry-button">
            Попробовать снова
          </button>
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