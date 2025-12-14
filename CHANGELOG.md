# Changelog

Все значимые изменения в этом проекте будут документированы в этом файле.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/),
и этот проект придерживается [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 14-12-2025

### Добавлено

#### Token Usage
- **Save Execution ID** - Сохранение текущего execution ID n8n для последующего отслеживания токенов
- **Get Token Usage** - Получение данных об использовании токенов из завершенных executions через n8n API
- Поддержка n8n API credentials (apiKey и baseUrl)
- Извлечение данных о токенах LLM из выводов `ai_languageModel`
- Мультипровайдерная поддержка: работает с любым LLM провайдером (OpenAI, Anthropic, Google, Mistral и др.)
- Возврат детальной информации о токенах: promptTokens, completionTokens, totalTokens
- Извлечение названия модели и сообщений из данных execution

#### Token Cost (OpenRouter)
- Автоматический расчёт стоимости токенов на основе цен OpenRouter API
- Расчёт promptCost, completionCost и totalCost в USD
- Работает в связке с Token Usage (Get Token Usage)

### Протестировано
- AI Agent (+ tools)
- Basic LLM Chain
- Guardrails

### Важно
- Расчёт стоимости работает только при точном совпадении названия модели с ID модели в OpenRouter

### Документация
- README.md на английском языке
- ruREADME.md на русском языке

---

## [Unreleased]

### Планируется
- Поддержка настраиваемых цен токенов
