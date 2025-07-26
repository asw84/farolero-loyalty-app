// src/pages/ReferralPage.tsx
// ВЕРСИЯ С QR-КОДОМ

import { useEffect, useState } from 'react';
import { QRCodeCanvas } from 'qrcode.react'; // <--- Импортируем компонент QR-кода
import { useTelegram } from '../hooks/useTelegram';
import { fetchUserData } from '../api';
import './ReferralPage.css';

interface UserData {
  referralLink: string;
}

const ReferralPage = () => {
  const { user, tg } = useTelegram();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchUserData(user.id)
        .then(data => setUserData(data))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [user]);

  const copyLink = () => {
    if (userData?.referralLink) {
      navigator.clipboard.writeText(userData.referralLink).then(() => {
        tg.HapticFeedback.notificationOccurred('success');
        tg.showPopup({
          title: 'Готово!',
          message: 'Ваша реферальная ссылка скопирована.',
          buttons: [{ id: 'ok', type: 'ok', text: 'Отлично' }]
        });
      }).catch(err => {
        console.error('Ошибка копирования в буфер обмена:', err);
        tg.showAlert('Не удалось скопировать ссылку.');
      });
    }
  };

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>Загрузка информации...</div>;
  }

  return (
    <div className="referral-container">
      <h1>Пригласите друга</h1>
      <p className="referral-description">
        Поделитесь ссылкой или просто покажите QR-код. Когда друг совершит свою первую покупку, вы оба получите бонусные баллы!
      </p>

      {/* --- БЛОК С QR-КОДОМ --- */}
      {userData?.referralLink && (
        <div className="qr-code-wrapper">
          <QRCodeCanvas
            value={userData.referralLink} // Ссылка для кодирования
            size={180}                     // Размер в пикселях
            bgColor={"#ffffff"}            // Цвет фона
            fgColor={"#282420"}            // Цвет кода
            level={"H"}                    // Уровень коррекции ошибок (L, M, Q, H)
            includeMargin={true}           // Включить отступы
          />
        </div>
      )}
      {/* -------------------- */}
      
      <div className="referral-link-box">
        <p className="link-label">Или скопируйте ссылку вручную:</p>
        <div className="link-wrapper">
          <input 
            type="text" 
            value={userData?.referralLink || 'Не удалось загрузить ссылку'} 
            readOnly 
            onClick={copyLink}
          />
          <button onClick={copyLink}>Копировать</button>
        </div>
      </div>
      
    </div>
  );
};

export default ReferralPage;