# n8n-nodes-openrouter-token-tracker

<div align="center">

[🇷🇺 Русский](https://github.com/Vlad-Loop/n8n-nodes-openrouter-token-tracker/blob/master/ruREADME.md)

</div>

[![npm version](https://img.shields.io/npm/v/n8n-nodes-openrouter-token-tracker.svg)](https://www.npmjs.com/package/n8n-nodes-openrouter-token-tracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Custom n8n node for tracking and calculating OpenRouter AI API token costs.

**Why this node was created:** When using AI models through OpenRouter, it's important to track costs for budgeting and optimization. This node automatically calculates the cost of API requests based on token usage and current model pricing.

## Supported Features

- **From Input Data** - Automatically extract model and token usage from previous node output
- **From Generation ID** - Get exact cost from OpenRouter's billing API (most accurate)
- **Manual Input** - Manually enter model and token counts for cost calculation

## Quick Installation

### Via Community Nodes (Recommended)

1. Open n8n
2. Go to **Settings** > **Community Nodes**
3. Click **Install**
4. Enter `n8n-nodes-openrouter-token-tracker`
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
npm link n8n-nodes-openrouter-token-tracker

# Start n8n
n8n
```

## Setup

1. Get your API key from [OpenRouter Settings](https://openrouter.ai/settings/keys)
2. In n8n, create a credential of type **OpenRouter API**
3. Enter your API key

## Operations

### 1. From Input Data (Default)

Automatically extracts model and token usage from the previous node's output. Works with any node that returns OpenRouter/OpenAI-compatible response format.

**Required input fields:**
- `model` - The model ID (e.g., "openai/gpt-4o")
- `usage.prompt_tokens` - Number of input tokens
- `usage.completion_tokens` - Number of output tokens

### 2. From Generation ID

Gets the exact cost from OpenRouter's generation API. This is the most accurate method as it uses the actual billing data.

**Required:**
- Generation ID (the `id` field from OpenRouter response)

### 3. Manual Input

Manually enter the model and token counts to calculate costs.

**Required:**
- Model (selected from dropdown with all available models)
- Input Tokens
- Output Tokens

## Output Example

The node outputs a `tokenCost` object:

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

## Options

- **Include Raw Response** - Include the raw API response in the output
- **Pass Through Input** - Include the original input data in the output (enabled by default)

## Usage Examples

### Track costs from OpenRouter Chat
```
[OpenRouter Chat] → [Token Cost Tracker] → [Google Sheets]
```

### Get exact cost by Generation ID
```
[HTTP Request to OpenRouter] → [Token Cost Tracker (From Generation ID)]
```

### Budget alerting
```
[Token Cost Tracker] → [IF cost > threshold] → [Send Slack Alert]
```

## Disclaimer

> [!WARNING]
> Cost calculations are estimates based on OpenRouter API data. Always verify costs in your OpenRouter dashboard. The author is not responsible for any billing discrepancies.

## Documentation

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [OpenRouter API Reference](https://openrouter.ai/docs/api-reference)
- [n8n Community Nodes](https://docs.n8n.io/integrations/community-nodes/)

## Contributing

Contributions are welcome!

1. Fork the repository
2. Create a branch for your changes
3. Make changes and test them
4. Create a Pull Request

## Support and Contact

- **Author**: https://t.me/vlad_loop
- **Issues**: [GitHub Issues](https://github.com/Vlad-Loop/n8n-nodes-openrouter-token-tracker/issues)

## License

MIT License - see [LICENSE](LICENSE) for details.
