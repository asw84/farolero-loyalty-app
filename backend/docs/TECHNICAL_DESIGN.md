# 🏗️ Технический дизайн - Farolero Loyalty App

> **Technical Design Document**  
> **Версия**: 2.0  
> **Дата**: 2025-01-31  
> **Проект**: Telegram Mini App с программой лояльности

## 🎯 Архитектурный обзор

### Системная архитектура
```mermaid
graph TB
    subgraph "Клиент"
        TMA[Telegram Mini App<br/>React 19 + TypeScript]
        TB[Telegram Bot<br/>Node.js]
    end
    
    subgraph "API Gateway"
        API[Express.js Backend<br/>REST API]
        MW[Middleware<br/>Auth, CORS, Rate Limiting]
    end
    
    subgraph "Бизнес-логика"
        AS[Auth Service]
        LS[Loyalty Service]
        RS[RFM Service]
        SS[Social Service]
        WS[Webhook Service]
    end
    
    subgraph "Хранилище"
        DB[(SQLite Database<br/>+WAL Mode)]
        CACHE[Memory Cache<br/>Redis-like)]
        FILES[File Storage<br/>Local/Cloud)]
    end
    
    subgraph "Внешние API"
        AMO[AmoCRM API<br/>REST v4]
        VK[VK API<br/>OAuth 2.0]
        IG[Instagram API<br/>Basic Display]
        QT[Qtickets API<br/>REST]
        UNI[Unisender API<br/>REST]
        TGAPI[Telegram Bot API]
    end
    
    TMA --> API
    TB --> API
    API --> MW
    MW --> AS
    MW --> LS
    MW --> RS
    MW --> SS
    MW --> WS
    
    AS --> DB
    LS --> DB
    RS --> DB
    SS --> DB
    WS --> DB
    
    LS --> CACHE
    RS --> CACHE
    
    AS --> AMO
    SS --> VK
    SS --> IG
    LS --> QT
    WS --> UNI
    TB --> TGAPI
```

## 🛠️ Технологический стек

### Frontend (Telegram Mini App)

#### Основные технологии
- **React**: v19+ (latest)
- **TypeScript**: v5.9+ 
- **Vite**: v6+ (build tool)
- **React Router DOM**: v6.8+ (routing)

#### UI/UX Библиотеки
```json
{
  "@telegram-apps/sdk": "^2.0.0",
  "@telegram-apps/sdk-react": "^1.1.0",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^6.8.0",
  "qr-code-generator": "^1.4.4"
}
```

#### Стили и анимации
```json
{
  "css-variables": "native",
  "css-modules": "optional",
  "animations": "css-transitions"
}
```

### Backend (Node.js API)

#### Core Framework
- **Node.js**: v22.17+ (LTS)
- **Express.js**: v5.1+ 
- **TypeScript**: опционально (рекомендуется для больших команд)

#### Database & ORM
```json
{
  "better-sqlite3": "^11.5.0",
  "sqlite3": "fallback",
  "knex": "^3.1.0"
}
```

#### Authentication & Security
```json
{
  "jsonwebtoken": "^9.0.0",
  "bcryptjs": "^2.4.3",
  "helmet": "^7.1.0",
  "cors": "^2.8.5",
  "express-rate-limit": "^7.1.0"
}
```

#### HTTP & API
```json
{
  "axios": "^1.6.0",
  "express-validator": "^7.0.0",
  "multer": "^1.4.5",
  "compression": "^1.7.4"
}
```

## 📊 Схема базы данных

### SQLite Schema (WAL Mode)
```sql
-- Пользователи
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    telegram_id TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    username TEXT,
    phone TEXT,
    email TEXT,
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'bronze', -- bronze, silver, gold, platinum
    amocrm_contact_id TEXT,
    vk_id TEXT,
    instagram_id TEXT,
    referral_code TEXT UNIQUE,
    referred_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Транзакции баллов
CREATE TABLE point_transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    amount INTEGER NOT NULL, -- может быть отрицательным
    type TEXT NOT NULL, -- registration, purchase, referral, social, review, walk
    description TEXT,
    order_id TEXT, -- связь с заказом если применимо
    metadata JSON, -- дополнительные данные
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Заказы через Qtickets
CREATE TABLE orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    qtickets_order_id TEXT UNIQUE,
    amount DECIMAL(10,2),
    cashback_used INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending', -- pending, paid, cancelled, refunded
    event_name TEXT,
    event_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Активность в социальных сетях
CREATE TABLE social_activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    platform TEXT NOT NULL, -- vk, instagram, telegram
    activity_type TEXT NOT NULL, -- like, comment, repost, subscription
    external_id TEXT, -- ID поста/комментария
    points_earned INTEGER DEFAULT 0,
    processed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- RFM сегменты
CREATE TABLE rfm_segments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id),
    recency_score INTEGER, -- 1-5
    frequency_score INTEGER, -- 1-5  
    monetary_score INTEGER, -- 1-5
    segment TEXT, -- champions, loyal_customers, potential_loyalists, etc.
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Токены для внешних API
CREATE TABLE tokens (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    service TEXT NOT NULL, -- amocrm, vk, instagram
    access_token TEXT,
    refresh_token TEXT,
    expires_at INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(service)
);

-- Логи для отладки
CREATE TABLE activity_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER REFERENCES users(id),
    action TEXT NOT NULL,
    details JSON,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для производительности
CREATE INDEX idx_users_telegram_id ON users(telegram_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_point_transactions_user_id ON point_transactions(user_id);
CREATE INDEX idx_point_transactions_created_at ON point_transactions(created_at);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_social_activities_user_id ON social_activities(user_id);
CREATE INDEX idx_rfm_segments_user_id ON rfm_segments(user_id);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);
```

## 🔧 API Архитектура

### REST API Endpoints

#### Аутентификация
```typescript
// POST /api/auth/telegram
interface TelegramAuthRequest {
  initData: string; // Telegram Web App init data
  hash: string;
}

interface AuthResponse {
  token: string;
  user: User;
  expires: number;
}
```

#### Пользователи
```typescript
// GET /api/users/profile
interface UserProfile extends User {
  pointsBalance: number;
  currentStatus: LoyaltyStatus;
  nextStatusPoints: number;
  totalEarned: number;
  referralStats: ReferralStats;
}

// POST /api/users/link-social
interface LinkSocialRequest {
  platform: 'vk' | 'instagram';
  accessToken: string;
  userId: string;
}
```

#### Система лояльности
```typescript
// GET /api/loyalty/points/history
interface PointsHistory {
  transactions: PointTransaction[];
  pagination: PaginationMeta;
}

// POST /api/loyalty/points/add
interface AddPointsRequest {
  amount: number;
  type: PointTransactionType;
  description: string;
  metadata?: object;
}

// GET /api/loyalty/status
interface LoyaltyStatusResponse {
  current: LoyaltyStatus;
  progress: StatusProgress;
  benefits: StatusBenefits;
}
```

#### Реферальная программа
```typescript
// GET /api/referral/code
interface ReferralCodeResponse {
  code: string;
  qrCode: string; // base64 image
  link: string;
  stats: ReferralStats;
}

// GET /api/referral/stats
interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  totalEarned: number;
  monthlyEarned: number;
}
```

#### Заказы и покупки
```typescript
// GET /api/orders
interface OrdersResponse {
  orders: Order[];
  pagination: PaginationMeta;
}

// POST /api/orders/create
interface CreateOrderRequest {
  eventId: string;
  ticketType: string;
  quantity: number;
  useCashback: boolean;
  cashbackAmount?: number;
}
```

#### RFM Аналитика
```typescript
// GET /api/analytics/rfm/segments
interface RFMSegmentsResponse {
  segments: Array<{
    name: string;
    count: number;
    percentage: number;
    criteria: RFMCriteria;
  }>;
}

// GET /api/analytics/rfm/user/:id
interface UserRFMResponse {
  userId: number;
  recency: number;
  frequency: number;
  monetary: number;
  segment: string;
  recommendations: string[];
}
```

### Middleware Pipeline
```typescript
// app.js
app.use(helmet()); // Security headers
app.use(cors(corsOptions)); // CORS
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(rateLimit(rateLimitConfig)); // Rate limiting
app.use('/api', authMiddleware); // JWT validation
app.use('/api', validationMiddleware); // Request validation
app.use(errorHandler); // Global error handler
```

## 🔐 Безопасность и авторизация

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: number;
  telegramId: string;
  iat: number;
  exp: number;
  scope: string[]; // ['user', 'admin']
}

// Telegram Web App validation
const validateTelegramAuth = (initData: string, botToken: string): boolean => {
  const urlParams = new URLSearchParams(initData);
  const hash = urlParams.get('hash');
  urlParams.delete('hash');
  
  const dataCheckString = Array.from(urlParams.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join('\n');
  
  const secretKey = crypto
    .createHmac('sha256', 'WebAppData')
    .update(botToken)
    .digest();
  
  const expectedHash = crypto
    .createHmac('sha256', secretKey)
    .update(dataCheckString)
    .digest('hex');
  
  return hash === expectedHash;
};
```

### API Key Management
```typescript
// Сервисы внешних API
interface APICredentials {
  amocrm: {
    clientId: string;
    clientSecret: string;
    redirectUri: string;
  };
  vk: {
    clientId: string;
    clientSecret: string;
    serviceKey: string;
  };
  instagram: {
    appId: string;
    appSecret: string;
    redirectUri: string;
  };
  qtickets: {
    apiKey: string;
    merchantId: string;
  };
  unisender: {
    apiKey: string;
  };
  telegram: {
    botToken: string;
  };
}
```

### Tokens Storage Strategy
```typescript
// Тройная защита токенов AmoCRM
class TokenManager {
  // 1. File storage (primary)
  async saveToFile(tokens: Tokens): Promise<void> {
    await fs.writeFile(TOKENS_PATH, JSON.stringify(tokens, null, 2));
  }
  
  // 2. Environment variables (backup)
  async saveToEnv(tokens: Tokens): Promise<void> {
    process.env.AMOCRM_ACCESS_TOKEN = tokens.accessToken;
    process.env.AMOCRM_REFRESH_TOKEN = tokens.refreshToken;
  }
  
  // 3. Database (persistent backup)
  async saveToDatabase(tokens: Tokens): Promise<void> {
    await db.run(`
      INSERT OR REPLACE INTO tokens 
      (service, access_token, refresh_token, expires_at) 
      VALUES (?, ?, ?, ?)
    `, ['amocrm', tokens.accessToken, tokens.refreshToken, tokens.expiresAt]);
  }
  
  // Automatic restoration
  async restoreTokens(): Promise<Tokens | null> {
    // Try file first
    if (await fs.exists(TOKENS_PATH)) {
      return JSON.parse(await fs.readFile(TOKENS_PATH, 'utf-8'));
    }
    
    // Try environment variables
    if (process.env.AMOCRM_REFRESH_TOKEN) {
      return {
        accessToken: process.env.AMOCRM_ACCESS_TOKEN,
        refreshToken: process.env.AMOCRM_REFRESH_TOKEN,
        expiresAt: parseInt(process.env.AMOCRM_EXPIRES_AT)
      };
    }
    
    // Try database
    const row = await db.get(
      'SELECT * FROM tokens WHERE service = ?', 
      ['amocrm']
    );
    
    return row ? {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at
    } : null;
  }
}
```

## 🔌 Интеграции с внешними API

### AmoCRM API Client
```typescript
class AmoCRMClient {
  private tokenManager: TokenManager;
  
  constructor() {
    this.tokenManager = new TokenManager();
  }
  
  async createContact(userData: User): Promise<string> {
    const tokens = await this.tokenManager.getValidTokens();
    
    const contactData = {
      name: `${userData.firstName} ${userData.lastName}`,
      custom_fields_values: [
        {
          field_id: TELEGRAM_ID_FIELD_ID,
          values: [{ value: userData.telegramId }]
        },
        {
          field_id: POINTS_FIELD_ID,
          values: [{ value: userData.points.toString() }]
        }
      ]
    };
    
    const response = await axios.post(
      `${AMOCRM_BASE_URL}/api/v4/contacts`,
      [contactData],
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    return response.data._embedded.contacts[0].id;
  }
  
  async updateContactPoints(amocrmId: string, points: number): Promise<void> {
    const tokens = await this.tokenManager.getValidTokens();
    
    await axios.patch(
      `${AMOCRM_BASE_URL}/api/v4/contacts/${amocrmId}`,
      {
        custom_fields_values: [
          {
            field_id: POINTS_FIELD_ID,
            values: [{ value: points.toString() }]
          }
        ]
      },
      {
        headers: {
          'Authorization': `Bearer ${tokens.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
  }
}
```

### VK API Client
```typescript
class VKClient {
  async validateUser(accessToken: string, userId: string): Promise<boolean> {
    try {
      const response = await axios.get('https://api.vk.com/method/users.get', {
        params: {
          user_ids: userId,
          access_token: accessToken,
          v: '5.131'
        }
      });
      
      return !response.data.error && response.data.response?.length > 0;
    } catch (error) {
      return false;
    }
  }
  
  async checkActivity(userId: string, postId: string): Promise<SocialActivity[]> {
    const activities: SocialActivity[] = [];
    
    // Check likes
    const likes = await this.getLikes(postId);
    if (likes.includes(userId)) {
      activities.push({
        type: 'like',
        platform: 'vk',
        externalId: postId,
        points: 5
      });
    }
    
    // Check comments
    const comments = await this.getComments(postId);
    const userComment = comments.find(c => c.from_id === parseInt(userId));
    if (userComment) {
      activities.push({
        type: 'comment',
        platform: 'vk',
        externalId: userComment.id.toString(),
        points: 10
      });
    }
    
    return activities;
  }
}
```

### Qtickets API Client
```typescript
class QticketsClient {
  async getEvents(): Promise<Event[]> {
    const response = await axios.get(`${QTICKETS_BASE_URL}/events`, {
      headers: {
        'Authorization': `Bearer ${process.env.QTICKETS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
    
    return response.data.events.map(event => ({
      id: event.id,
      name: event.name,
      description: event.description,
      date: new Date(event.date),
      price: event.price,
      availableTickets: event.available_tickets
    }));
  }
  
  async createOrder(orderData: CreateOrderRequest, userId: number): Promise<Order> {
    const response = await axios.post(
      `${QTICKETS_BASE_URL}/orders`,
      {
        event_id: orderData.eventId,
        ticket_type: orderData.ticketType,
        quantity: orderData.quantity,
        user_reference: userId.toString(),
        payment_method: orderData.useCashback ? 'points' : 'card'
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.QTICKETS_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    // Save order to local database
    const order = await db.run(`
      INSERT INTO orders (user_id, qtickets_order_id, amount, status, event_name)
      VALUES (?, ?, ?, ?, ?)
    `, [
      userId,
      response.data.id,
      response.data.total_amount,
      response.data.status,
      response.data.event_name
    ]);
    
    return order;
  }
}
```

## 📈 RFM-анализ

### RFM Calculation Engine
```typescript
class RFMAnalyzer {
  async calculateRFMScores(userId: number): Promise<RFMScores> {
    const now = new Date();
    const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    
    // Recency: дни с последней покупки
    const lastOrder = await db.get(`
      SELECT MAX(created_at) as last_purchase
      FROM orders 
      WHERE user_id = ? AND status = 'paid'
    `, [userId]);
    
    const recency = lastOrder?.last_purchase 
      ? Math.floor((now.getTime() - new Date(lastOrder.last_purchase).getTime()) / (1000 * 60 * 60 * 24))
      : 999;
    
    // Frequency: количество покупок за год
    const frequency = await db.get(`
      SELECT COUNT(*) as purchase_count
      FROM orders 
      WHERE user_id = ? AND status = 'paid' AND created_at >= ?
    `, [userId, oneYearAgo.toISOString()]);
    
    // Monetary: общая сумма покупок за год
    const monetary = await db.get(`
      SELECT SUM(amount) as total_spent
      FROM orders 
      WHERE user_id = ? AND status = 'paid' AND created_at >= ?
    `, [userId, oneYearAgo.toISOString()]);
    
    return {
      recency: this.scoreRecency(recency),
      frequency: this.scoreFrequency(frequency.purchase_count || 0),
      monetary: this.scoreMonetary(monetary.total_spent || 0)
    };
  }
  
  private scoreRecency(days: number): number {
    if (days <= 30) return 5;
    if (days <= 90) return 4;
    if (days <= 180) return 3;
    if (days <= 365) return 2;
    return 1;
  }
  
  private scoreFrequency(count: number): number {
    if (count >= 10) return 5;
    if (count >= 5) return 4;
    if (count >= 3) return 3;
    if (count >= 2) return 2;
    return 1;
  }
  
  private scoreMonetary(amount: number): number {
    if (amount >= 50000) return 5;
    if (amount >= 20000) return 4;
    if (amount >= 10000) return 3;
    if (amount >= 5000) return 2;
    return 1;
  }
  
  determineSegment(scores: RFMScores): string {
    const { recency: R, frequency: F, monetary: M } = scores;
    
    if (R >= 4 && F >= 4 && M >= 4) return 'champions';
    if (R >= 3 && F >= 3 && M >= 3) return 'loyal_customers';
    if (R >= 3 && F <= 2 && M <= 2) return 'potential_loyalists';
    if (R >= 4 && F <= 2 && M <= 2) return 'new_customers';
    if (R >= 3 && F >= 3 && M <= 2) return 'promising';
    if (R >= 3 && F <= 2 && M >= 3) return 'need_attention';
    if (R <= 2 && F >= 3 && M >= 3) return 'at_risk';
    if (R <= 2 && F >= 2 && M >= 2) return 'cannot_lose_them';
    if (R <= 2 && F <= 2 && M >= 3) return 'hibernating';
    return 'lost';
  }
}
```

### Loyalty Status System
```typescript
class LoyaltyStatusManager {
  private readonly STATUS_THRESHOLDS = {
    bronze: { min: 0, max: 499, cashback: 0.05 },
    silver: { min: 500, max: 1499, cashback: 0.10 },
    gold: { min: 1500, max: 2999, cashback: 0.15 },
    platinum: { min: 3000, max: Infinity, cashback: 0.20 }
  };
  
  calculateStatus(points: number): LoyaltyStatus {
    for (const [status, config] of Object.entries(this.STATUS_THRESHOLDS)) {
      if (points >= config.min && points <= config.max) {
        return {
          name: status as StatusName,
          cashbackRate: config.cashback,
          pointsToNext: status === 'platinum' ? 0 : config.max + 1 - points,
          benefits: this.getStatusBenefits(status as StatusName)
        };
      }
    }
    return this.STATUS_THRESHOLDS.bronze;
  }
  
  private getStatusBenefits(status: StatusName): StatusBenefits {
    const benefits = {
      bronze: ['Базовый кэшбэк 5%', 'Уведомления о новых мероприятиях'],
      silver: ['Кэшбэк 10%', 'Приоритетная поддержка', 'Раннее бронирование'],
      gold: ['Кэшбэк 15%', 'Персональные предложения', 'VIP статус'],
      platinum: ['Максимальный кэшбэк 20%', 'Эксклюзивные мероприятия', 'Персональный менеджер']
    };
    
    return benefits[status] || benefits.bronze;
  }
}
```

## 🚀 Deployment & DevOps

### Docker Configuration

#### `docker-compose.yml`
```yaml
version: '3.8'

services:
  backend:
    build: 
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
    volumes:
      # КРИТИЧНО: Persistent storage для токенов
      - amocrm_tokens:/app/tokens
      - sqlite_data:/app/database
      - logs_data:/app/logs
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    depends_on:
      - redis

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    restart: unless-stopped
    depends_on:
      - backend

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    restart: unless-stopped
    command: redis-server --appendonly yes

  nginx:
    image: nginx:alpine
    ports:
      - "8080:80"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - frontend_dist:/usr/share/nginx/html
    restart: unless-stopped

volumes:
  amocrm_tokens:
    driver: local
  sqlite_data:
    driver: local
  redis_data:
    driver: local
  logs_data:
    driver: local
  frontend_dist:
    driver: local
```

#### Backend `Dockerfile`
```dockerfile
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build if using TypeScript
# RUN npm run build

FROM node:22-alpine AS runtime

# Install required packages for better-sqlite3
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    sqlite

WORKDIR /app

# Copy built application
COPY --from=builder /app ./

# Create necessary directories
RUN mkdir -p /app/tokens /app/database /app/logs

# Set proper permissions
RUN chown -R node:node /app
USER node

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

EXPOSE 3001

CMD ["npm", "start"]
```

### GitHub Actions CI/CD

#### `.github/workflows/deploy.yml`
```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
          cache-dependency-path: |
            backend/package-lock.json
            frontend/package-lock.json
      
      - name: Install backend dependencies
        working-directory: ./backend
        run: npm ci
      
      - name: Install frontend dependencies
        working-directory: ./frontend
        run: npm ci
      
      - name: Run backend tests
        working-directory: ./backend
        run: npm test
      
      - name: Run frontend tests
        working-directory: ./frontend
        run: npm test
      
      - name: Build frontend
        working-directory: ./frontend
        run: npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup environment file
        run: |
          cat > backend/.env << EOF
          NODE_ENV=production
          PORT=3001
          JWT_SECRET=${{ secrets.JWT_SECRET }}
          
          # AmoCRM
          AMOCRM_CLIENT_ID=${{ secrets.AMOCRM_CLIENT_ID }}
          AMOCRM_CLIENT_SECRET=${{ secrets.AMOCRM_CLIENT_SECRET }}
          AMOCRM_ACCESS_TOKEN=${{ secrets.AMOCRM_ACCESS_TOKEN }}
          AMOCRM_REFRESH_TOKEN=${{ secrets.AMOCRM_REFRESH_TOKEN }}
          AMOCRM_BASE_URL=${{ secrets.AMOCRM_BASE_URL }}
          
          # VK
          VK_CLIENT_ID=${{ secrets.VK_CLIENT_ID }}
          VK_CLIENT_SECRET=${{ secrets.VK_CLIENT_SECRET }}
          VK_SERVICE_KEY=${{ secrets.VK_SERVICE_KEY }}
          
          # Instagram
          INSTAGRAM_APP_ID=${{ secrets.INSTAGRAM_APP_ID }}
          INSTAGRAM_APP_SECRET=${{ secrets.INSTAGRAM_APP_SECRET }}
          
          # Qtickets
          QTICKETS_API_KEY=${{ secrets.QTICKETS_API_KEY }}
          
          # Unisender
          UNISENDER_API_KEY=${{ secrets.UNISENDER_API_KEY }}
          
          # Telegram
          TELEGRAM_BOT_TOKEN=${{ secrets.TELEGRAM_BOT_TOKEN }}
          EOF
      
      - name: Deploy to server
        uses: appleboy/ssh-action@v1.0.3
        with:
          host: ${{ secrets.DEPLOY_HOST }}
          username: ${{ secrets.DEPLOY_USER }}
          key: ${{ secrets.DEPLOY_SSH_KEY }}
          script: |
            cd /opt/farolero-app
            
            # Backup current tokens
            if [ -f "backend/tokens.json" ]; then
              cp backend/tokens.json backup/tokens-$(date +%Y%m%d-%H%M%S).json
            fi
            
            # Pull latest changes
            git pull origin main
            
            # Copy environment file
            cp backend/.env.production backend/.env
            
            # Update containers
            docker-compose down
            docker-compose pull
            docker-compose up -d --build
            
            # Wait for services to be ready
            sleep 30
            
            # Health check
            curl -f http://localhost:3001/health || exit 1
            
            # Cleanup old images
            docker system prune -f
```

### Environment Configuration

#### Production `.env` template
```env
# Server Configuration
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_PATH=/app/database/farolero.db
TOKENS_PATH=/app/tokens

# Security
JWT_SECRET=your_super_secure_jwt_secret_here_make_it_long_and_random
CORS_ORIGINS=https://yourdomain.com,https://web.telegram.org

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# AmoCRM API
AMOCRM_BASE_URL=https://yourdomain.amocrm.ru
AMOCRM_CLIENT_ID=your_amocrm_client_id
AMOCRM_CLIENT_SECRET=your_amocrm_client_secret
AMOCRM_ACCESS_TOKEN=backup_access_token
AMOCRM_REFRESH_TOKEN=backup_refresh_token
AMOCRM_REDIRECT_URI=https://yourdomain.com/api/amocrm/callback

# VK API
VK_CLIENT_ID=your_vk_app_id
VK_CLIENT_SECRET=your_vk_client_secret
VK_SERVICE_KEY=your_vk_service_key
VK_REDIRECT_URI=https://yourdomain.com/api/vk/callback

# Instagram API
INSTAGRAM_APP_ID=your_instagram_app_id
INSTAGRAM_APP_SECRET=your_instagram_app_secret
INSTAGRAM_REDIRECT_URI=https://yourdomain.com/api/instagram/callback

# Qtickets API
QTICKETS_BASE_URL=https://api.qtickets.com
QTICKETS_API_KEY=your_qtickets_api_key
QTICKETS_MERCHANT_ID=your_merchant_id

# Unisender API
UNISENDER_BASE_URL=https://api.unisender.com
UNISENDER_API_KEY=your_unisender_api_key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/webhook/telegram

# Logging
LOG_LEVEL=info
LOG_FILE=/app/logs/app.log

# Monitoring
HEALTH_CHECK_ENDPOINT=/health
METRICS_ENDPOINT=/metrics
```

## 📊 Мониторинг и логирование

### Health Checks
```typescript
// healthcheck.js
const http = require('http');
const fs = require('fs').promises;

async function healthCheck() {
  try {
    // Check API server
    await new Promise((resolve, reject) => {
      const req = http.get('http://localhost:3001/health', (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`API health check failed: ${res.statusCode}`));
        }
      });
      req.on('error', reject);
      req.setTimeout(5000, () => reject(new Error('Health check timeout')));
    });
    
    // Check database
    const dbPath = process.env.DATABASE_PATH || '/app/database/farolero.db';
    await fs.access(dbPath);
    
    // Check tokens
    const tokensPath = process.env.TOKENS_PATH || '/app/tokens';
    await fs.access(tokensPath);
    
    console.log('✅ Health check passed');
    process.exit(0);
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    process.exit(1);
  }
}

healthCheck();
```

### Logging Strategy
```typescript
// logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'farolero-backend' },
  transports: [
    new winston.transports.File({ 
      filename: '/app/logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: '/app/logs/combined.log' 
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

## 🎯 Производительность и оптимизация

### Database Optimization
```typescript
// database.js с оптимизациями
const Database = require('better-sqlite3');

const db = new Database(process.env.DATABASE_PATH || './farolero.db', {
  verbose: process.env.NODE_ENV === 'development' ? console.log : null
});

// Включаем WAL mode для лучшей производительности
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 10000');
db.pragma('temp_store = MEMORY');

// Prepared statements для частых запросов
const preparedStatements = {
  getUserByTelegramId: db.prepare('SELECT * FROM users WHERE telegram_id = ?'),
  addPointTransaction: db.prepare(`
    INSERT INTO point_transactions (user_id, amount, type, description, metadata)
    VALUES (?, ?, ?, ?, ?)
  `),
  updateUserPoints: db.prepare('UPDATE users SET points = ? WHERE id = ?'),
  getUserPointsHistory: db.prepare(`
    SELECT * FROM point_transactions 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT ? OFFSET ?
  `)
};

module.exports = { db, statements: preparedStatements };
```

### Caching Strategy
```typescript
// cache.js
class MemoryCache {
  private cache = new Map();
  private ttl = new Map();
  
  set(key: string, value: any, ttlSeconds = 300): void {
    this.cache.set(key, value);
    this.ttl.set(key, Date.now() + ttlSeconds * 1000);
  }
  
  get(key: string): any {
    const expiry = this.ttl.get(key);
    if (!expiry || Date.now() > expiry) {
      this.cache.delete(key);
      this.ttl.delete(key);
      return null;
    }
    return this.cache.get(key);
  }
  
  // Cache для часто запрашиваемых данных
  async getUserProfile(userId: number): Promise<UserProfile> {
    const cacheKey = `user:${userId}`;
    let profile = this.get(cacheKey);
    
    if (!profile) {
      profile = await this.fetchUserProfile(userId);
      this.set(cacheKey, profile, 60); // 1 минута
    }
    
    return profile;
  }
  
  // Инвалидация кэша при обновлении данных
  invalidateUser(userId: number): void {
    this.cache.delete(`user:${userId}`);
    this.ttl.delete(`user:${userId}`);
  }
}
```

### Rate Limiting
```typescript
// rateLimiting.js
const rateLimit = require('express-rate-limit');

const createRateLimiter = (windowMs: number, max: number, message: string) => {
  return rateLimit({
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  // Общий лимит для API
  generalLimit: createRateLimiter(
    15 * 60 * 1000, // 15 minutes
    100, // requests per window
    'Слишком много запросов, попробуйте позже'
  ),
  
  // Строгий лимит для аутентификации
  authLimit: createRateLimiter(
    5 * 60 * 1000, // 5 minutes
    5, // requests per window
    'Слишком много попыток входа, попробуйте через 5 минут'
  ),
  
  // Лимит для внешних API
  externalApiLimit: createRateLimiter(
    60 * 1000, // 1 minute
    10, // requests per window
    'Превышен лимит обращений к внешним API'
  )
};
```

## 🔧 Инструменты разработки

### Development Scripts
```json
{
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "cd backend && npm run dev",
    "dev:frontend": "cd frontend && npm run dev",
    "build": "npm run build:frontend && npm run build:backend",
    "build:frontend": "cd frontend && npm run build",
    "build:backend": "cd backend && npm run build",
    "test": "npm run test:backend && npm run test:frontend",
    "test:backend": "cd backend && npm test",
    "test:frontend": "cd frontend && npm test",
    "docker:dev": "docker-compose -f docker-compose.dev.yml up",
    "docker:prod": "docker-compose up -d",
    "deploy": "chmod +x scripts/deploy.sh && ./scripts/deploy.sh",
    "backup": "chmod +x scripts/backup.sh && ./scripts/backup.sh"
  }
}
```

### Testing Strategy
```typescript
// backend/tests/api.test.js
const request = require('supertest');
const app = require('../app');

describe('API Tests', () => {
  let authToken;
  
  beforeAll(async () => {
    // Setup test database
    await setupTestDB();
    
    // Get auth token
    const response = await request(app)
      .post('/api/auth/telegram')
      .send({ initData: 'test_data', hash: 'test_hash' });
    
    authToken = response.body.token;
  });
  
  describe('GET /api/users/profile', () => {
    test('should return user profile', async () => {
      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('pointsBalance');
      expect(response.body).toHaveProperty('currentStatus');
    });
  });
  
  describe('POST /api/loyalty/points/add', () => {
    test('should add points to user', async () => {
      const pointsData = {
        amount: 100,
        type: 'manual',
        description: 'Test points'
      };
      
      const response = await request(app)
        .post('/api/loyalty/points/add')
        .set('Authorization', `Bearer ${authToken}`)
        .send(pointsData)
        .expect(201);
      
      expect(response.body.success).toBe(true);
      expect(response.body.newBalance).toBeGreaterThan(0);
    });
  });
});
```

---

## 📈 Метрики успеха

### Технические KPI
- **API Response Time**: < 500ms для 95% запросов
- **Database Query Time**: < 100ms для базовых операций
- **Uptime**: 99.9% доступность сервиса
- **Error Rate**: < 1% от общего количества запросов

### Бизнес KPI  
- **User Registration**: 100+ новых пользователей/месяц
- **Points Conversion**: 70%+ пользователей тратят баллы
- **Referral Rate**: 20%+ пользователей приводят друзей
- **Social Integration**: 50%+ пользователей связывают соцсети

---

**Документ создан**: 2025-01-31  
**Версия**: 2.0  
**Статус**: Готов к реализации  
**Следующий этап**: Имплементация MVP согласно плану

*Технический дизайн учитывает все требования из ТЗ, включает актуальные версии библиотек и решает проблему сохранения токенов AmoCRM.*
