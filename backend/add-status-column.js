// backend/add-status-column.js
// Добавление колонки status в таблицу users

const { getDbConnection } = require('./database');

async function addStatusColumn() {
    const db = getDbConnection();
    
    console.log('🔧 Добавление колонки status в таблицу users...\n');
    
    try {
        // Проверим, есть ли уже колонка status
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        const hasStatus = tableInfo.find(col => col.name === 'status');
        if (hasStatus) {
            console.log('✅ Колонка status уже существует');
            db.close();
            return;
        }
        
        // Добавляем колонку status
        await new Promise((resolve, reject) => {
            db.run("ALTER TABLE users ADD COLUMN status TEXT DEFAULT 'Бронза'", [], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        
        console.log('✅ Колонка status успешно добавлена');
        
        // Устанавливаем значение по умолчанию для существующих пользователей
        await new Promise((resolve, reject) => {
            db.run("UPDATE users SET status = 'Бронза' WHERE status IS NULL", [], (err) => {
                if (err) return reject(err);
                resolve();
            });
        });
        
        console.log('✅ Значения по умолчанию установлены');
        
        // Проверим результат
        const updatedTableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", [], (err, rows) => {
                if (err) return reject(err);
                resolve(rows);
            });
        });
        
        console.log('\n📋 Обновленная структура таблицы users:');
        updatedTableInfo.forEach(col => {
            const isNew = col.name === 'status' ? ' 🆕' : '';
            console.log(`   ${col.name} - ${col.type} ${col.notnull ? 'NOT NULL' : ''} ${col.dflt_value ? `DEFAULT ${col.dflt_value}` : ''}${isNew}`);
        });
        
        db.close();
        console.log('\n🎉 Миграция завершена успешно!');
        
    } catch (error) {
        console.error('❌ Ошибка миграции:', error);
        db.close();
        process.exit(1);
    }
}

addStatusColumn().catch(console.error);
