# n8n-nodes-token-usage

<div align="center">

🇺🇸 English | [🇷🇺 Русский](https://github.com/Vlad-Loop/n8n-nodes-token-usage/blob/master/ruREADME.md)

</div>

[![npm version](https://img.shields.io/npm/v/n8n-nodes-token-usage.svg)](https://www.npmjs.com/package/n8n-nodes-token-usage)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Custom n8n nodes for tracking LLM token usage and calculating costs across multiple providers.

**Why this package was created:** When using AI models in n8n workflows, it's important to track token usage and costs for budgeting and optimization. This package extracts token usage data from n8n executions via the n8n API and calculates costs using OpenRouter pricing.

![Token Usage node](https://raw.githubusercontent.com/Vlad-Loop/n8n-nodes-token-usage/master/screenshots/screen-1.png)

## Nodes

### Token Usage
- **Save Execution ID** - Captures current execution ID for later token tracking
- **Get Token Usage** - Fetches token usage data from completed executions via n8n API
- Works with any LLM provider that reports token usage (testing was done only on OpenRouter)

### Token Cost (OpenRouter)
- Calculates LLM costs using OpenRouter pricing data
- Returns promptCost, completionCost, and totalCost in USD
- Works **ONLY** in conjunction with Token Usage (Get Token Usage)

## Tested With

This package has been tested with the following n8n AI nodes:
- **AI Agent (+tools)**
- **Basic LLM Chain**
- **Guardrails**

> **Important:** Cost calculation only works when the model name in n8n exactly matches the model ID in OpenRouter (e.g., `openai/gpt-4o-mini`, `anthropic/claude-3-sonnet`).

## Quick Installation

### Via Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-token-usage`
5. Click **Install**

### Via Local Development

1. Clone the repository
2. In the repository, run the following commands:
```bash
npm install
npm run build
npm link
```

3. In your locally running n8n:
```bash
cd ~/.n8n
mkdir custom && cd custom
npm init -y
npm link n8n-nodes-token-usage

# Start n8n
n8n
```

## Setup

### For Token Usage
1. In n8n, go to **Settings** > **n8n API**
2. Create an API key
3. Create a credential of type **n8n API** in your workflow
4. Enter your API key and base URL (e.g., `http://localhost:5678`)

### For Token Cost (OpenRouter)
1. Get your API key from [OpenRouter](https://openrouter.ai/keys)
2. Create a credential of type **OpenRouter API** in your workflow
3. Enter your API key

## Operations

### 1. Save Execution ID (Default)

Captures the current workflow execution ID. Use this at the end of your main workflow to save the ID for later token tracking.

**Output:**
```json
{
  "execution_id": "267"
}
```

### 2. Get Token Usage

Fetches token usage data from a completed execution. This operation calls the n8n API to retrieve execution data and extracts LLM token usage from `ai_languageModel` outputs.

**Required:**
- Execution ID (from the Save operation or any other source)

**Output:**
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

Calculates the cost of LLM token usage using OpenRouter pricing data.

**Required:**
- Input from Token Usage (Get Token Usage)
- OpenRouter API credentials

**Output:**
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

## Usage Pattern

The recommended pattern is to use a Sub-Workflow:

1. Place **Token Usage (Save Execution ID)** at the end of your main workflow after LLM nodes
2. Pass the `execution_id` to a Sub-Workflow
3. In the Sub-Workflow, use **Token Usage (Get Token Usage)** to fetch token data
4. Optionally, connect **Token Cost (OpenRouter)** to calculate costs
5. The Sub-Workflow runs after the main execution completes

### Example Workflow

```
Main Workflow:
[Trigger] → [AI Agent / Chat Model] → [Token Usage (Save)] → [Execute Sub-Workflow]

Sub-Workflow:
[Receive execution_id] → [Token Usage (Get Token Usage)] → [Token Cost (OpenRouter)] → [Google Sheets / Database]
```

### Budget Alerting

```
[Token Cost (OpenRouter)] → [IF totalCost > threshold] → [Send Slack Alert]
```

## Why Use a Sub-Workflow?

The n8n API only returns complete execution data after the execution finishes. By using a Sub-Workflow, you ensure the main execution is complete before fetching token data.

## Disclaimer

> [!WARNING]
> - This package is not affiliated with n8n GmbH or OpenRouter
> - Token usage data accuracy depends on the provider's token counting
> - Pricing data is fetched from OpenRouter API and may change without notice
> - Cost calculation only works when model names exactly match OpenRouter model IDs
> - Always verify costs in your provider's dashboard for billing purposes

## Documentation

- [n8n API Documentation](https://docs.n8n.io/api/)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch for your changes
3. Make changes and test them
4. Create a Pull Request

## Support and Contact

- **Author**: https://t.me/vlad_loop
- **Issues**: [GitHub Issues](https://github.com/Vlad-Loop/n8n-nodes-token-usage/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.
