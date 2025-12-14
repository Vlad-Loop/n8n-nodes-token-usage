# n8n-nodes-token-usage

<div align="center">

[English](https://github.com/Vlad-Loop/n8n-nodes-token-usage/blob/master/README.md) | Русский

</div>

[![npm version](https://img.shields.io/npm/v/n8n-nodes-token-usage.svg)](https://www.npmjs.com/package/n8n-nodes-token-usage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Кастомные ноды для n8n, которые отслеживают использование токенов LLM и рассчитывают стоимость от различных провайдеров.

**Зачем этот пакет:** При использовании AI моделей в n8n workflows важно отслеживать использование токенов и стоимость для бюджетирования и оптимизации. Этот пакет извлекает данные об использовании токенов из n8n executions через n8n API и рассчитывает стоимость на основе цен OpenRouter.

![Telegram Stars node](https://raw.githubusercontent.com/Vlad-Loop/n8n-nodes-token-usage/master/screenshots/screen-1.png)

## Ноды

### Token Usage
- **Save Execution ID** - Сохранение текущего execution ID для последующего отслеживания токенов
- **Get Token Usage** - Получение данных об использовании токенов из завершенных executions через n8n API
- Работает с любым LLM провайдером, который сообщает об использовании токенов (тестирование велось только на OpenRouter)

### Token Cost (OpenRouter)
- Рассчитывает стоимость LLM на основе цен OpenRouter API
- Возвращает promptCost, completionCost и totalCost в USD
- Работает **ТОЛЬКО** в связке с Token Usage (Get Token Usage)

## Протестировано с

Пакет протестирован со следующими AI нодами n8n:
- **AI Agent (+tools)**
- **Basic LLM Chain**
- **Guardrails**

> **Важно:** Расчёт стоимости работает только при точном совпадении названия модели с ID модели в OpenRouter (например, `openai/gpt-4o-mini`, `anthropic/claude-3-sonnet`).

## Быстрая установка

### Через Community Nodes (рекомендуется)

1. Откройте n8n
2. Перейдите в **Settings** > **Community Nodes**
3. Нажмите **Install**
4. Введите `n8n-nodes-token-usage`
5. Нажмите **Install**

### Через локальную разработку

1. Скачайте репозиторий
2. В репозитории выполните следующие команды:
```bash
npm install
npm run build
npm link
```

3. В поднятом локально n8n:
```bash
cd ~/.n8n
mkdir custom && cd custom
npm init -y
npm link n8n-nodes-token-usage

# Запустить n8n
n8n
```

## Настройка

### Для Token Usage
1. В n8n перейдите в **Settings** > **n8n API**
2. Создайте API ключ
3. В вашем workflow создайте credential типа **n8n API**
4. Введите API ключ и base URL (например, `http://localhost:5678`)

### Для Token Cost (OpenRouter)
1. Получите API ключ на [OpenRouter](https://openrouter.ai/keys)
2. В вашем workflow создайте credential типа **OpenRouter API**
3. Введите API ключ

## Операции

### 1. Save Execution ID (По умолчанию)

Сохраняет текущий execution ID workflow. Используйте в конце основного workflow для сохранения ID для последующего отслеживания токенов.

**Вывод:**
```json
{
  "execution_id": "267"
}
```

### 2. Get Token Usage

Получает данные об использовании токенов из завершенного execution. Эта операция вызывает n8n API для получения данных execution и извлекает использование токенов LLM из выводов `ai_languageModel`.

**Требуется:**
- Execution ID (из операции Save или любого другого источника)

**Вывод:**
```json
{
  "execution_id": "267",
  "totalTokenUsage": {
    "promptTokens": 13,
    "completionTokens": 20,
    "totalTokens": 33
  },
  "llmCalls": [
    {
      "nodeName": "OpenAI Chat Model",
      "tokenUsage": {
        "promptTokens": 13,
        "completionTokens": 20,
        "totalTokens": 33
      },
      "model": "openai/gpt-4o-mini",
      "messages": ["Human: Hello"],
      "estimatedTokens": 8
    }
  ]
}
```

### 3. Token Cost (OpenRouter)

Рассчитывает стоимость использования токенов LLM на основе цен OpenRouter.

**Требуется:**
- Входные данные от Token Usage (Get Token Usage)
- OpenRouter API credentials

**Вывод:**
```json
{
  "execution_id": "267",
  "totalTokenUsage": {
    "promptTokens": 13,
    "completionTokens": 20,
    "totalTokens": 33
  },
  "llmCalls": [
    {
      "nodeName": "OpenAI Chat Model",
      "tokenUsage": {
        "promptTokens": 13,
        "completionTokens": 20,
        "totalTokens": 33
      },
      "model": "openai/gpt-4o-mini",
      "messages": ["Human: Hello"],
      "estimatedTokens": 8,
      "cost": {
        "promptCost": 0.00000195,
        "completionCost": 0.00000600,
        "totalCost": 0.00000795,
        "currency": "USD"
      }
    }
  ],
  "totalCost": {
    "promptCost": 0.00000195,
    "completionCost": 0.00000600,
    "totalCost": 0.00000795,
    "currency": "USD"
  }
}
```

## Паттерн использования

Рекомендуемый паттерн - использование Sub-Workflow:

1. Разместите **Token Usage (Save Execution ID)** в конце основного workflow после LLM нод
2. Передайте `execution_id` в Sub-Workflow
3. В Sub-Workflow используйте **Token Usage (Get Token Usage)** для получения данных о токенах
4. Опционально подключите **Token Cost (OpenRouter)** для расчёта стоимости
5. Sub-Workflow запускается после завершения основного execution

### Пример Workflow

```
Основной Workflow:
[Trigger] → [AI Agent / Chat Model] → [Token Usage (Save)] → [Execute Sub-Workflow]

Sub-Workflow:
[Получение execution_id] → [Token Usage (Get Token Usage)] → [Token Cost (OpenRouter)] → [Google Sheets / Database]
```

### Алертинг при превышении лимита

```
[Token Cost (OpenRouter)] → [IF totalCost > порог] → [Отправка в Slack]
```

## Зачем использовать Sub-Workflow?

n8n API возвращает полные данные execution только после завершения выполнения. Используя Sub-Workflow, вы гарантируете, что основной execution завершен перед получением данных о токенах.

## Дисклаймер

> [!WARNING]
> - Этот пакет не связан с n8n GmbH или OpenRouter
> - Точность данных об использовании токенов зависит от подсчёта провайдером
> - Цены берутся из OpenRouter API и могут измениться без предупреждения
> - Расчёт стоимости работает только при точном совпадении названий моделей с ID в OpenRouter
> - Всегда проверяйте расходы в дашборде вашего провайдера для целей биллинга

## Документация

- [Документация n8n API](https://docs.n8n.io/api/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Вклад в проект

Вклад приветствуется!

1. Форкните репозиторий
2. Создайте ветку для ваших изменений
3. Внесите изменения и протестируйте их
4. Создайте Pull Request

## Поддержка и связь

- **Автор**: https://t.me/vlad_loop
- **Issues**: [GitHub Issues](https://github.com/Vlad-Loop/n8n-nodes-token-usage/issues)

## Лицензия

MIT License - см. [LICENSE](LICENSE) для подробностей.
