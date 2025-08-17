// backend/check-table-structure.js
// Проверка структуры таблицы users

const { getDbConnection } = require('./database');

async function checkTableStructure() {
    const db = getDbConnection();
    
    console.log('🔍 Проверка структуры таблицы users...\n');
    
    try {
        // Получить структуру таблицы
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        console.log('📋 Колонки в таблице users:');
        tableInfo.forEach(col => {
            console.log(`   ${col.name} - ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}`);
        });
        
        console.log('\n🔍 Проверка наличия колонки status:');
        const hasStatus = tableInfo.find(col => col.name === 'status');
        if (hasStatus) {
            console.log('✅ Колонка status найдена:', hasStatus);
        } else {
            console.log('❌ Колонка status НЕ найдена!');
            console.log('🔧 Необходимо добавить колонку status в таблицу');
        }
        
        // Проверим содержимое таблицы
        console.log('\n📊 Содержимое таблицы users:');
        const users = await new Promise((resolve, reject) => {
            db.all("SELECT * FROM users LIMIT 5", [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        if (users.length > 0) {
            console.log(`   Найдено ${users.length} пользователей:`);
            users.forEach(user => {
                console.log(`   - ID: ${user.id}, Telegram: ${user.telegram_user_id}, Баллы: ${user.points}, Статус: ${user.status || 'НЕТ'}`);
            });
        } else {
            console.log('   Таблица пустая');
        }
        
        db.close();
        
    } catch (error) {
        console.error('❌ Ошибка проверки:', error);
        db.close();
    }
}

checkTableStructure().catch(console.error);
