// frontend/src/pages/ReferralPage.tsx
// ИСПРАВЛЕННАЯ ВЕРСИЯ С КОНТЕКСТОМ

import { QRCodeSVG } from 'qrcode.react';
import { useUser } from '../hooks/useUser';

const ReferralPage = () => {
  // --- Получаем все данные из общего хранилища ---
  const { userData, loading } = useUser();
  const { referralLink } = userData;
  // ---------------------------------------------

  const handleCopy = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      // Можно добавить уведомление об успешном копировании
      alert('Ссылка скопирована!');
    }
  };

  if (loading) {
    return <div>Загрузка...</div>;
  }

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>Пригласите друга</h2>
      <p>Поделитесь ссылкой или просто покажите QR-код. Когда друг совершит свою первую покупку, вы оба получите бонусные баллы!</p>

      <div style={{ margin: '30px 0' }}>
        {referralLink ? (
          <QRCodeSVG value={referralLink} size={200} />
        ) : (
          <p>Не удалось загрузить QR-код</p>
        )}
      </div>
      
      <p>Или скопируйте ссылку вручную:</p>
      
      {referralLink ? (
        <>
          <code>{referralLink}</code>
          <button onClick={handleCopy} style={{ marginLeft: '10px' }}>Копировать</button>
        </>
      ) : (
        <p>Не удалось загрузить ссылку</p>
      )}
    </div>
  );
};

export default ReferralPage;