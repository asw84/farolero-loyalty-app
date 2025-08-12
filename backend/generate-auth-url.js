const config = require('./amocrm/amocrm.json');

// Формируем URL для авторизации
const authUrl = new URL(`${config.base_url}/oauth2/authorize`);
authUrl.searchParams.set('client_id', config.client_id);
authUrl.searchParams.set('state', 'random_state_string');
authUrl.searchParams.set('response_type', 'code');
authUrl.searchParams.set('mode', 'post_message');
authUrl.searchParams.set('redirect_uri', config.redirect_uri);

console.log('Перейдите по следующему URL для авторизации в AmoCRM:');
console.log(authUrl.toString());
console.log('\nПосле авторизации скопируйте код из параметра "code" в URL редиректа');
console.log('и вставьте его в поле "auth_code" в файле backend/amocrm/amocrm.json');