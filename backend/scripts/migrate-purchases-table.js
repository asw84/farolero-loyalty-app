// backend/scripts/migrate-purchases-table.js
// Миграция для добавления полей кэшбэка в таблицу purchases

const { getDbConnection, dbRun, dbGet } = require('../database');

async function migratePurchasesTable() {
    console.log('🔄 [Migration] Начинаю миграцию таблицы purchases...');
    
    try {
        // Проверяем, есть ли уже новые поля
        const tableInfo = await new Promise((resolve, reject) => {
            const db = getDbConnection();
            db.all("PRAGMA table_info(purchases)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const existingColumns = tableInfo.map(col => col.name);
        console.log('📊 [Migration] Существующие колонки:', existingColumns);
        
        const newColumns = [
            { name: 'event_id', type: 'INTEGER' },
            { name: 'event_name', type: 'TEXT' },
            { name: 'cashback_used', type: 'DECIMAL(10,2) DEFAULT 0' },
            { name: 'final_price', type: 'DECIMAL(10,2)' }
        ];
        
        // Добавляем только отсутствующие колонки
        for (const column of newColumns) {
            if (!existingColumns.includes(column.name)) {
                console.log(`➕ [Migration] Добавляю колонку ${column.name}...`);
                await dbRun(`ALTER TABLE purchases ADD COLUMN ${column.name} ${column.type}`);
                console.log(`✅ [Migration] Колонка ${column.name} добавлена`);
            } else {
                console.log(`⚠️ [Migration] Колонка ${column.name} уже существует`);
            }
        }
        
        // Обновляем существующие записи, добавляя недостающие данные
        console.log('🔧 [Migration] Обновляю существующие записи...');
        await dbRun(`
            UPDATE purchases 
            SET 
                final_price = CASE WHEN final_price IS NULL THEN amount ELSE final_price END,
                cashback_used = CASE WHEN cashback_used IS NULL THEN 0 ELSE cashback_used END
            WHERE final_price IS NULL OR cashback_used IS NULL
        `);
        
        // Создаем индексы для новых полей
        console.log('📇 [Migration] Создаю индексы...');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_purchases_event_id ON purchases(event_id);');
        await dbRun('CREATE INDEX IF NOT EXISTS idx_purchases_cashback ON purchases(cashback_used);');
        
        console.log('✅ [Migration] Миграция завершена успешно!');
        return true;
        
    } catch (error) {
        console.error('❌ [Migration] Ошибка миграции:', error);
        throw error;
    }
}

// Запускаем миграцию если скрипт вызван напрямую
if (require.main === module) {
    migratePurchasesTable()
        .then(() => {
            console.log('🎉 [Migration] Миграция выполнена!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('💥 [Migration] Ошибка:', error);
            process.exit(1);
        });
}

module.exports = { migratePurchasesTable };
