// backend/init-db.js
// Скрипт инициализации базы данных

const { initializeDatabase } = require('./database');

console.log('🗄️  Инициализация базы данных...');

async function init() {
    try {
        await initializeDatabase();
        
        console.log('✅ База данных успешно инициализирована!');
        console.log('📊 Все таблицы созданы:');
        console.log('   - users (пользователи)');
        console.log('   - referrals (реферальная система)');
        console.log('   - purchases (покупки)');
        console.log('   - rfm_segments (RFM сегментация)');
        console.log('');
        console.log('🚀 Теперь можно запускать сервер: node server.js');
        process.exit(0);
        
    } catch (error) {
        console.error('❌ Ошибка инициализации базы данных:', error);
        process.exit(1);
    }
}

init();
