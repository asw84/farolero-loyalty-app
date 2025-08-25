// backend/scripts/add-vk-fields.js
// Добавляет недостающие VK поля в таблицу users

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = '/app/farolero.db'; // Фиксированный путь в контейнере

console.log('🔧 Добавление VK полей в таблицу users...');
console.log('📍 Путь к БД:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Ошибка подключения к БД:', err.message);
        process.exit(1);
    }
    console.log('✅ Подключение к SQLite успешно');
});

// Используем async обработчик для sqlite3
async function addVKFields() {
    try {
        // Проверяем существующую структуру
        const tableInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        const existingColumns = tableInfo.map(col => col.name);
        console.log('📋 Существующие колонки:', existingColumns);

        // Добавляем новые VK поля если их нет
        const vkFields = [
            { name: 'vk_id', type: 'TEXT' },
            { name: 'vk_first_name', type: 'TEXT' },
            { name: 'vk_last_name', type: 'TEXT' },
            { name: 'vk_photo', type: 'TEXT' }
        ];

        for (const field of vkFields) {
            if (!existingColumns.includes(field.name)) {
                const alterSql = `ALTER TABLE users ADD COLUMN ${field.name} ${field.type}`;
                console.log(`➕ Добавляем поле: ${field.name}`);
                
                await new Promise((resolve, reject) => {
                    db.run(alterSql, (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
                });
            } else {
                console.log(`✅ Поле уже существует: ${field.name}`);
            }
        }

        // Проверяем финальную структуру
        const finalInfo = await new Promise((resolve, reject) => {
            db.all("PRAGMA table_info(users)", (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
        
        console.log('🎯 Финальная структура таблицы users:');
        finalInfo.forEach(col => {
            console.log(`  - ${col.name}: ${col.type}${col.notnull ? ' NOT NULL' : ''}${col.pk ? ' PRIMARY KEY' : ''}`);
        });

        console.log('✅ VK поля успешно добавлены!');

    } catch (error) {
        console.error('❌ Ошибка при добавлении VK полей:', error);
        process.exit(1);
    } finally {
        db.close();
    }
}

// Запускаем после подключения к БД
setTimeout(addVKFields, 100); // Небольшая задержка для инициализации
