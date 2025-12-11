# n8n-nodes-openrouter-token-tracker

<div align="center">

[English](https://github.com/Vlad-Loop/n8n-nodes-openrouter-token-tracker/blob/master/README.md) | Русский

</div>

[![npm version](https://img.shields.io/npm/v/n8n-nodes-openrouter-token-tracker.svg)](https://www.npmjs.com/package/n8n-nodes-openrouter-token-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Кастомная нода для n8n, которая отслеживает и рассчитывает стоимость токенов OpenRouter AI API.

**Зачем эта нода:** При использовании AI моделей через OpenRouter важно отслеживать расходы для бюджетирования и оптимизации. Эта нода автоматически рассчитывает стоимость API запросов на основе использования токенов и актуальных цен моделей.

## Поддерживаемые возможности

- **From Input Data** - Автоматическое извлечение модели и токенов из вывода предыдущей ноды
- **From Generation ID** - Получение точной стоимости из API биллинга OpenRouter (самый точный метод)
- **Manual Input** - Ручной ввод модели и количества токенов для расчета стоимости

## Быстрая установка

### Через Community Nodes (рекомендуется)

1. Откройте n8n
2. Перейдите в **Settings** > **Community Nodes**
3. Нажмите **Install**
4. Введите `n8n-nodes-openrouter-token-tracker`
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
npm link n8n-nodes-openrouter-token-tracker

# Запустить n8n
n8n
```

## Настройка

1. Получите API ключ на [OpenRouter Settings](https://openrouter.ai/settings/keys)
2. В n8n создайте credential типа **OpenRouter API**
3. Введите ваш API ключ

## Операции

### 1. From Input Data (По умолчанию)

Автоматически извлекает модель и использование токенов из вывода предыдущей ноды. Работает с любой нодой, возвращающей формат ответа совместимый с OpenRouter/OpenAI.

**Обязательные поля во входных данных:**
- `model` - ID модели (например, "openai/gpt-4o")
- `usage.prompt_tokens` - Количество входных токенов
- `usage.completion_tokens` - Количество выходных токенов

### 2. From Generation ID

Получает точную стоимость из API генераций OpenRouter. Это самый точный метод, так как использует реальные данные биллинга.

**Требуется:**
- Generation ID (поле `id` из ответа OpenRouter)

### 3. Manual Input

Ручной ввод модели и количества токенов для расчета стоимости.

**Требуется:**
- Модель (выбирается из выпадающего списка всех доступных моделей)
- Входные токены (Input Tokens)
- Выходные токены (Output Tokens)

## Пример вывода

Нода выводит объект `tokenCost`:

```json
{
  "tokenCost": {
    "model": "openai/gpt-4o",
    "modelName": "GPT-4o",
    "tokens": {
      "input": 100,
      "output": 50,
      "total": 150
    },
    "costs": {
      "inputCost": 0.00025,
      "outputCost": 0.0005,
      "totalCost": 0.00075,
      "formatted": "$0.000750"
    },
    "pricing": {
      "promptPricePerToken": 0.0000025,
      "completionPricePerToken": 0.00001,
      "promptPricePerMillion": 2.5,
      "completionPricePerMillion": 10,
      "source": "models_api"
    },
    "metadata": {
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

## Опции

- **Include Raw Response** - Включить сырой ответ API в вывод
- **Pass Through Input** - Включить исходные входные данные в вывод (включено по умолчанию)

## Примеры использования

### Отслеживание расходов от OpenRouter Chat
```
[OpenRouter Chat] → [Token Cost Tracker] → [Google Sheets]
```

### Получение точной стоимости по Generation ID
```
[HTTP Request к OpenRouter] → [Token Cost Tracker (From Generation ID)]
```

### Алертинг при превышении бюджета
```
[Token Cost Tracker] → [IF cost > порог] → [Отправка в Slack]
```

## Дисклаймер

> [!WARNING]
> Расчеты стоимости являются оценками на основе данных API OpenRouter. Всегда проверяйте расходы в вашем дашборде OpenRouter. Автор не несет ответственности за расхождения в биллинге.

## Документация

- [Документация OpenRouter](https://openrouter.ai/docs)
- [Справочник API OpenRouter](https://openrouter.ai/docs/api-reference)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Вклад в проект

Вклад приветствуется!

1. Форкните репозиторий
2. Создайте ветку для ваших изменений
3. Внесите изменения и протестируйте их
4. Создайте Pull Request

## Поддержка и связь

- **Автор**: https://t.me/vlad_loop
- **Issues**: [GitHub Issues](https://github.com/Vlad-Loop/n8n-nodes-openrouter-token-tracker/issues)

## Лицензия

MIT License - см. [LICENSE](LICENSE) для подробностей.
