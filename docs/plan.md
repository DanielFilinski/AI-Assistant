Я проанализирую файл технического задания и помогу оценить возможность реализации. Давайте сначала прочитаем файл.

[1 tool called]

## Анализ реализуемости проекта

Да, проект **полностью реализуем**, но потребует значительных усилий. Это тестовое задание для senior full-stack разработчика с жестким лимитом времени (3 часа). Вот мой анализ:

### ✅ Технически возможно:
- **Все технологии доступны**: Next.js 15, React 19, Tailwind 4, Cloudflare Workers, Gemini API (бесплатный тир)
- **Четкие требования**: задание хорошо структурировано с конкретными функциями
- **Масштаб разумный**: для опытного разработчика 3-4 часа реально при правильном подходе

### ⚠️ Основные сложности:

1. **Cloudflare Workers с Next.js** - требует специальной конфигурации (@cloudflare/next-on-pages)
2. **База данных** - нужно выбрать подходящую для Workers (D1, KV, или внешнюю)
3. **Жесткий тайминг** - 3 часа очень мало для всех требований
4. **Интеграция AI** - нужен опыт работы с промптами и обработкой JSON от LLM

---

## 📋 План реализации

### **Фаза 0: Подготовка (10 минут)**

**Действия:**
- Создать репозиторий GitHub
- Настроить Next.js 15 проект с TypeScript
- Установить зависимости: Tailwind 4, Zod, react-hook-form
- Настроить @cloudflare/next-on-pages для Workers
- Получить API ключ Gemini
- Выбрать базу данных

**Рекомендация по БД:**
```
Cloudflare D1 (SQLite) + KV
Почему:
- Нативная интеграция с Workers
- Бесплатный тир
- D1 для основных данных
- KV для сессий (быстрый доступ)
```

---

### **Фаза 1: Аутентификация + База данных (45 минут)**

#### 1.1 Схема базы данных (15 мин)

**Таблицы D1 (SQL):**

```sql
-- users
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at INTEGER NOT NULL
);

-- form_progress (для автосохранения)
CREATE TABLE form_progress (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL, -- JSON
  current_step INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- form_submissions
CREATE TABLE form_submissions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  form_data TEXT NOT NULL, -- JSON
  submitted_at INTEGER NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ai_usage (для rate limiting)
CREATE TABLE ai_usage (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  request_count INTEGER NOT NULL,
  window_start INTEGER NOT NULL,
  tokens_used INTEGER,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX idx_ai_usage_user ON ai_usage(user_id, window_start);
```

**Cloudflare KV для сессий:**
```
Key: session:{token}
Value: { userId, expiresAt }
TTL: 24 часа
```

#### 1.2 Аутентификация Magic Link (30 мин)

**Файлы:**
```
app/api/auth/start/route.ts
app/api/auth/verify/route.ts
app/api/auth/session/route.ts
app/api/auth/logout/route.ts
lib/auth.ts
```

**Логика:**
1. POST /api/auth/start - генерирует токен, сохраняет в KV
2. Отображает magic link в UI (т.к. нет email в Workers)
3. GET /verify?token=... - проверяет токен, создает сессию
4. Middleware проверяет сессии на защищенных роутах

---

### **Фаза 2: Многоэтапная форма (60 минут)**

#### 2.1 Структура компонентов (20 мин)

```
app/
  form/
    page.tsx              # Main form container
  components/
    form/
      Step1Personal.tsx
      Step2Experience.tsx
      Step3Skills.tsx
      Step4Motivation.tsx
      StepIndicator.tsx
      ReviewPage.tsx
lib/
  form-schema.ts          # Zod schemas
  form-context.tsx        # State management
```

#### 2.2 Навигация и валидация (20 мин)

**Стейт менеджмент:**
- Использовать React Context + useState
- Хранить данные всех шагов в памяти
- Отслеживать текущий шаг

**Валидация:**
```typescript
// Zod schemas для каждого шага
const step1Schema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  location: z.string().min(2)
});
```

#### 2.3 Автосохранение (20 мин)

**API Routes:**
```typescript
// app/api/forms/save/route.ts
POST /api/forms/save
{
  currentStep: number,
  formData: object
}

// app/api/forms/progress/route.ts
GET /api/forms/progress
// Возвращает сохраненный прогресс

// app/api/forms/submit/route.ts
POST /api/forms/submit
```

**Логика:**
- Debounced автосохранение при изменении полей (500ms)
- Сохранение при переходе на следующий шаг
- При загрузке страницы - запрос GET /api/forms/progress
- Индикатор "Saving..." → "Saved"

---

### **Фаза 3: AI интеграция (45 минут)**

#### 3.1 Rate Limiting (10 мин)

**Middleware функция:**
```typescript
// lib/rate-limit.ts
async function checkRateLimit(userId: string, db: D1Database) {
  const now = Date.now();
  const windowStart = now - 5 * 60 * 1000; // 5 минут
  
  // Подсчет запросов за последние 5 минут
  const { count } = await db
    .prepare('SELECT COUNT(*) as count FROM ai_usage WHERE user_id = ? AND window_start > ?')
    .bind(userId, windowStart)
    .first();
    
  if (count >= 10) {
    throw new Error('Rate limit exceeded');
  }
  
  // Логируем использование
  await db.prepare('INSERT INTO ai_usage ...').run();
}
```

#### 3.2 Автозаполнение резюме (25 мин)

**API Route:**
```typescript
// app/api/ai/autofill/route.ts
POST /api/ai/autofill
{
  resumeText: string
}
```

**Prompt для Gemini:**
```typescript
const prompt = `
Extract structured information from this resume and return ONLY valid JSON.

Resume:
${resumeText}

Return this exact JSON structure:
{
  "fullName": "string",
  "email": "string",
  "phone": "string",
  "location": "string (City, Country)",
  "currentPosition": "string",
  "company": "string",
  "yearsOfExperience": number,
  "keyAchievements": "string (bullet points)",
  "primarySkills": "string",
  "programmingLanguages": "string",
  "frameworks": "string"
}

Respond ONLY with the JSON, no additional text.
`;
```

**Обработка:**
```typescript
// Отправка в Gemini
const response = await fetch(
  `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
  {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  }
);

// Парсинг ответа
const data = await response.json();
const text = data.candidates[0].content.parts[0].text;
const extracted = JSON.parse(text); // С обработкой ошибок!
```

#### 3.3 Улучшение текста (10 мин)

**API Route:**
```typescript
// app/api/ai/improve/route.ts
POST /api/ai/improve
{
  text: string,
  field: string // "achievements" | "skills" | "motivation"
}
```

**Prompt:**
```typescript
const prompt = `
Rewrite the following ${field} text to be more professional and compelling.
Keep the same meaning but make it more polished.
Return ONLY the improved text, no explanation.

Original:
${text}

Improved:
`;
```

---

### **Фаза 4: Тестирование (30 минут)**

#### 4.1 Настройка Playwright (5 мин)

```bash
npm install -D @playwright/test
npx playwright install
```

**playwright.config.ts:**
```typescript
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: 'http://localhost:3000',
  },
});
```

#### 4.2 Критические тесты (25 мин)

**tests/critical-flow.spec.ts:**

```typescript
test('full authentication and form flow', async ({ page }) => {
  // 1. Аутентификация
  await page.goto('/');
  await page.fill('[name="email"]', 'test@example.com');
  await page.click('button:has-text("Send Magic Link")');
  
  // Получить magic link из UI и перейти
  const linkText = await page.locator('[data-testid="magic-link"]').textContent();
  const token = new URL(linkText).searchParams.get('token');
  await page.goto(`/api/auth/verify?token=${token}`);
  
  // 2. Заполнение Step 1
  await page.goto('/form');
  await page.fill('[name="fullName"]', 'John Doe');
  await page.fill('[name="email"]', 'john@example.com');
  await page.fill('[name="phone"]', '+1-555-0123');
  await page.fill('[name="location"]', 'San Francisco, USA');
  await page.click('button:has-text("Next")');
  
  // 3. Проверка автосохранения
  await page.waitForSelector('text=Saved');
  
  // 4. Перезагрузка страницы
  await page.reload();
  
  // 5. Проверка восстановления данных
  await expect(page.locator('text=Step 2 of 4')).toBeVisible();
  await page.goto('/form'); // Вернуться к шагу 1
  await expect(page.locator('[name="fullName"]')).toHaveValue('John Doe');
  
  // 6. Завершение всех шагов и отправка
  // ... заполнить остальные шаги ...
  
  await page.click('button:has-text("Submit")');
  await expect(page.locator('text=Success')).toBeVisible();
});

test('AI autofill from resume', async ({ page }) => {
  // Авторизация...
  await page.goto('/form');
  
  await page.click('button:has-text("Import from Resume")');
  await page.fill('[name="resumeText"]', SAMPLE_RESUME);
  await page.click('button:has-text("Extract Information")');
  
  await page.waitForSelector('[data-testid="extracted-data"]');
  await page.click('button:has-text("Accept")');
  
  // Проверка заполнения полей
  await expect(page.locator('[name="fullName"]')).toHaveValue('John Doe');
  await expect(page.locator('[name="email"]')).toHaveValue('john.doe@email.com');
});

test('AI rate limiting', async ({ page }) => {
  // Авторизация...
  
  // Выполнить 10 запросов
  for (let i = 0; i < 10; i++) {
    await page.click('button:has-text("AI Improve")');
    await page.waitForSelector('text=Improved');
  }
  
  // 11-й запрос должен показать ошибку
  await page.click('button:has-text("AI Improve")');
  await expect(page.locator('text=Rate limit exceeded')).toBeVisible();
  await expect(page.locator('text=Try again in')).toBeVisible();
});

test('auth protection', async ({ page, context }) => {
  // Очистить cookies
  await context.clearCookies();
  
  await page.goto('/form');
  await expect(page).toHaveURL('/login');
  
  const response = await page.request.get('/api/forms/progress');
  expect(response.status()).toBe(401);
});
```

---

### **Фаза 5: Деплой и документация (30 минут)**

#### 5.1 Cloudflare Workers Deploy (15 мин)

**wrangler.toml:**
```toml
name = "smart-form-assistant"
compatibility_date = "2024-01-01"

[[d1_databases]]
binding = "DB"
database_name = "forms_db"
database_id = "..."

[[kv_namespaces]]
binding = "SESSIONS"
id = "..."

[env.production]
vars = { }
```

**Команды:**
```bash
# Создать D1 базу
npx wrangler d1 create forms_db
npx wrangler d1 execute forms_db --file=./schema.sql

# Создать KV namespace
npx wrangler kv:namespace create "SESSIONS"

# Деплой
npm run build
npx @cloudflare/next-on-pages
npx wrangler pages deploy .vercel/output/static
```

**Секреты:**
```bash
npx wrangler secret put GEMINI_API_KEY
```

#### 5.2 Документация (15 мин)

**README.md:**
- Обзор архитектуры
- Схема БД с диаграммой
- Инструкции по установке и запуску
- API endpoints документация
- Технические решения и компромиссы
- Production gaps

**QUESTIONNAIRE.md:**
- Временная разбивка по задачам
- Обоснование выбора технологий
- Промпты для Gemini (реальные!)
- Сложности и их решения
- Трекинг использования AI инструментов

**SCHEMA.sql:**
- Полная SQL схема с комментариями
- Индексы и их обоснование

---

## ⏱️ Реалистичная оценка времени

| Фаза | Заявлено | Реально |
|------|----------|---------|
| Подготовка | 10 мин | 15-20 мин |
| Auth + DB | 45 мин | 60-75 мин |
| Форма | 60 мин | 75-90 мин |
| AI | 45 мин | 45-60 мин |
| Тесты | 30 мин | 45-60 мин |
| Деплой + Docs | 30 мин | 30-45 мин |
| **ИТОГО** | **3.5 часа** | **4.5-6 часов** |

---

## 🎯 Стратегия успеха

### Что делать ОБЯЗАТЕЛЬНО (для прохождения):
1. ✅ Magic Link аутентификация (простейший вариант)
2. ✅ D1 + KV для хранения
3. ✅ Автосохранение и восстановление формы
4. ✅ Автозаполнение резюме через Gemini
5. ✅ Rate limiting для AI
6. ✅ Базовые Playwright тесты (4 основных теста)
7. ✅ Деплой на Workers

### Что делать, если осталось время:
1. 🔶 Вторая AI функция (Improve text)
2. 🔶 Интеллектуальная валидация
3. 🔶 Список прошлых отправок
4. 🔶 Более детальные тесты

### Что пропустить при нехватке времени:
1. ⏭️ Красивый UI (достаточно функциональности)
2. ⏭️ Дополнительные AI фичи
3. ⏭️ Сложную валидацию
4. ⏭️ Оптимизации производительности

---

## 🚨 Критические моменты (автоотклонение):

❌ **Нельзя допустить:**
- Отсутствие аутентификации
- Форма не сохраняется/не восстанавливается
- In-memory хранение вместо БД
- Нет интеграции с Gemini
- Тесты не запускаются
- Не задеплоено
- Хардкод API ключей
- Нет rate limiting для AI

---

## 📊 Вывод

**Проект реализуем**, но требует:
- **Опыт**: senior full-stack разработчик
- **Время**: 4-6 часов чистого времени (не 3!)
- **Знания**: Next.js 15, Cloudflare Workers, AI промптинг, тестирование

**Рекомендации:**
1. Использовать готовые UI библиотеки (shadcn/ui)
2. Максимально упростить аутентификацию (Magic Link)
3. Сосредоточиться на core функциональности
4. Оставить время на тесты и документацию (30% от времени)
5. Протестировать деплой заранее

Это типичное **senior take-home задание** для позиции full-stack разработчика в продуктовой компании. Удачи! 🚀