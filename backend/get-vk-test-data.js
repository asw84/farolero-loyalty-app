// backend/get-vk-test-data.js
// Скрипт для получения реальных данных для тестирования VK API

require('dotenv').config();
const axios = require('axios');

console.log('🔵 === ПОЛУЧЕНИЕ ДАННЫХ ДЛЯ ТЕСТИРОВАНИЯ VK ===');
console.log('📅', new Date().toLocaleString());
console.log('');

const VK_ACCESS_TOKEN = process.env.VK_ACCESS_TOKEN;
const VK_GROUP_TOKEN = process.env.VK_GROUP_TOKEN;
const VK_SERVICE_KEY = process.env.VK_SERVICE_KEY;
const VK_GROUP_ID = process.env.VK_GROUP_ID;

// Получаем информацию о группе
async function getGroupInfo() {
    try {
        console.log('🏢 === ИНФОРМАЦИЯ О ГРУППЕ ===');
        
        const token = VK_SERVICE_KEY || VK_GROUP_TOKEN || VK_ACCESS_TOKEN;
        if (!token) {
            console.log('❌ Токен доступа не настроен');
            return;
        }

        const response = await axios.get('https://api.vk.com/method/groups.getById', {
            params: {
                group_id: VK_GROUP_ID,
                access_token: token,
                v: '5.199'
            }
        });

        if (response.data.error) {
            console.error('❌ Ошибка:', response.data.error.error_msg);
            return;
        }

        const group = response.data.response[0];
        console.log(`✅ Название группы: ${group.name}`);
        console.log(`✅ ID группы: ${group.id}`);
        console.log(`✅ Screen name: ${group.screen_name}`);
        console.log(`✅ Участников: ${group.members_count}`);
        console.log(`✅ URL: https://vk.com/${group.screen_name}`);
        
        return group;
    } catch (error) {
        console.error('❌ Ошибка при получении информации о группе:', error.message);
    }
}

// Получаем последние посты группы
async function getGroupPosts() {
    try {
        console.log('');
        console.log('📝 === ПОСТЫ ГРУППЫ ===');
        
        const token = VK_GROUP_TOKEN || VK_ACCESS_TOKEN || VK_SERVICE_KEY;
        if (!token) {
            console.log('❌ Токен доступа не настроен');
            return;
        }

        const response = await axios.get('https://api.vk.com/method/wall.get', {
            params: {
                owner_id: `-${VK_GROUP_ID}`,
                count: 5,
                access_token: token,
                v: '5.199'
            }
        });

        if (response.data.error) {
            console.error('❌ Ошибка:', response.data.error.error_msg);
            return;
        }

        const posts = response.data.response.items;
        console.log(`✅ Найдено ${posts.length} постов:`);
        
        posts.forEach((post, index) => {
            console.log(`\n📄 Пост ${index + 1}:`);
            console.log(`   ID: ${post.id}`);
            console.log(`   Owner ID: ${post.owner_id}`);
            console.log(`   Полный ID: ${post.owner_id}_${post.id}`);
            console.log(`   Лайков: ${post.likes?.count || 0}`);
            console.log(`   Комментариев: ${post.comments?.count || 0}`);
            console.log(`   Репостов: ${post.reposts?.count || 0}`);
            
            const text = post.text ? post.text.substring(0, 100) + '...' : 'Без текста';
            console.log(`   Текст: ${text}`);
            
            if (index === 0) {
                console.log(`\n🎯 ДЛЯ ТЕСТИРОВАНИЯ используйте:`);
                console.log(`   ownerId: ${post.owner_id}`);
                console.log(`   postId: ${post.id}`);
            }
        });
        
        return posts;
    } catch (error) {
        console.error('❌ Ошибка при получении постов:', error.message);
    }
}

// Получаем информацию о текущем пользователе (если есть пользовательский токен)
async function getCurrentUser() {
    try {
        console.log('');
        console.log('👤 === ТЕКУЩИЙ ПОЛЬЗОВАТЕЛЬ ===');
        
        if (!VK_ACCESS_TOKEN) {
            console.log('⚠️  VK_ACCESS_TOKEN не настроен - пропускаем получение данных пользователя');
            return;
        }

        const response = await axios.get('https://api.vk.com/method/users.get', {
            params: {
                access_token: VK_ACCESS_TOKEN,
                v: '5.199'
            }
        });

        if (response.data.error) {
            console.error('❌ Ошибка:', response.data.error.error_msg);
            return;
        }

        const user = response.data.response[0];
        console.log(`✅ Имя: ${user.first_name} ${user.last_name}`);
        console.log(`✅ ID пользователя: ${user.id}`);
        console.log(`✅ URL: https://vk.com/id${user.id}`);
        
        console.log(`\n🎯 ДЛЯ ТЕСТИРОВАНИЯ используйте USER_VK_ID: ${user.id}`);
        
        return user;
    } catch (error) {
        console.error('❌ Ошибка при получении данных пользователя:', error.message);
    }
}

// Генерируем команду для тестирования
function generateTestCommand(posts, user) {
    console.log('');
    console.log('🚀 === КОМАНДА ДЛЯ ТЕСТИРОВАНИЯ ===');
    
    if (!posts || posts.length === 0) {
        console.log('❌ Нет данных для генерации команды');
        return;
    }
    
    const post = posts[0];
    const userId = user?.id || 'ВАШ_VK_ID';
    
    console.log('Запустите тест с реальными данными:');
    console.log('');
    console.log('```bash');
    console.log('cd backend');
    console.log('node test-vk-social-tracking.js --interactive');
    console.log('```');
    console.log('');
    console.log('Введите при запросе:');
    console.log(`- VK ID пользователя: ${userId}`);
    console.log(`- ID поста: ${post.id}`);
    console.log('');
    
    if (userId === 'ВАШ_VK_ID') {
        console.log('⚠️  ВАЖНО: Замените ВАШ_VK_ID на реальный ID пользователя VK');
        console.log('   Можно получить ID здесь: https://regvk.com/id/');
    }
}

// Проверяем настройку токенов
function checkTokens() {
    console.log('🔧 === ПРОВЕРКА ТОКЕНОВ ===');
    
    const tokens = {
        'VK_ACCESS_TOKEN': VK_ACCESS_TOKEN,
        'VK_GROUP_TOKEN': VK_GROUP_TOKEN, 
        'VK_SERVICE_KEY': VK_SERVICE_KEY,
        'VK_GROUP_ID': VK_GROUP_ID
    };
    
    Object.entries(tokens).forEach(([name, value]) => {
        if (!value || value.includes('YOUR_') || value.includes('REQUIRED')) {
            console.log(`❌ ${name} не настроен`);
        } else {
            console.log(`✅ ${name} настроен`);
        }
    });
    
    console.log('');
}

// Запуск всех проверок
async function main() {
    checkTokens();
    
    const group = await getGroupInfo();
    const posts = await getGroupPosts(); 
    const user = await getCurrentUser();
    
    generateTestCommand(posts, user);
    
    console.log('');
    console.log('📋 === СЛЕДУЮЩИЕ ШАГИ ===');
    console.log('1. Используйте полученные данные для тестирования');
    console.log('2. Запустите: node test-vk-social-tracking.js --interactive');
    console.log('3. Введите реальные ID пользователя и поста');
    console.log('4. Проверьте работу VK API методов');
}

main().catch(console.error);
