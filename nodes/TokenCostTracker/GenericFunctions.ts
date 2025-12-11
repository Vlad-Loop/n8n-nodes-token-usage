import type {
	IExecuteFunctions,
	ILoadOptionsFunctions,
	IHttpRequestMethods,
	IRequestOptions,
	IDataObject,
} from 'n8n-workflow';

import type {
	OpenRouterModel,
	OpenRouterModelsResponse,
	GenerationStats,
	TokenCostResult,
} from './types';

const OPENROUTER_API_BASE_URL = 'https://openrouter.ai/api/v1';

/**
 * Make an authenticated request to OpenRouter API
 */
export async function openRouterApiRequest(
	this: IExecuteFunctions | ILoadOptionsFunctions,
	method: IHttpRequestMethods,
	endpoint: string,
	body?: IDataObject,
	query?: IDataObject,
): Promise<IDataObject> {
	const credentials = await this.getCredentials('openRouterApi');

	const options: IRequestOptions = {
		method,
		headers: {
			Authorization: `Bearer ${credentials.apiKey}`,
			'Content-Type': 'application/json',
		},
		uri: `${OPENROUTER_API_BASE_URL}${endpoint}`,
		json: true,
	};

	if (body && Object.keys(body).length > 0) {
		options.body = body;
	}

	if (query && Object.keys(query).length > 0) {
		options.qs = query;
	}

	return this.helpers.request(options);
}

/**
 * Get all available models with their pricing information
 */
export async function getModelsWithPricing(
	this: IExecuteFunctions | ILoadOptionsFunctions,
): Promise<OpenRouterModel[]> {
	const response = (await openRouterApiRequest.call(
		this,
		'GET',
		'/models',
	)) as unknown as OpenRouterModelsResponse;

	return response.data || [];
}

/**
 * Get generation statistics by generation ID
 */
export async function getGenerationStats(
	this: IExecuteFunctions,
	generationId: string,
): Promise<GenerationStats> {
	const response = (await openRouterApiRequest.call(this, 'GET', '/generation', undefined, {
		id: generationId,
	})) as { data: GenerationStats };

	return response.data || response;
}

/**
 * Find pricing for a specific model by ID
 */
export function findModelPricing(
	models: OpenRouterModel[],
	modelId: string,
): { prompt: number; completion: number; model: OpenRouterModel } | null {
	// Try exact match first
	let model = models.find((m) => m.id === modelId);

	// Try without provider prefix (e.g., "gpt-4o" instead of "openai/gpt-4o")
	if (!model && !modelId.includes('/')) {
		model = models.find((m) => m.id.endsWith(`/${modelId}`));
	}

	// Try partial match
	if (!model) {
		model = models.find((m) => m.id.toLowerCase().includes(modelId.toLowerCase()));
	}

	if (!model) {
		return null;
	}

	return {
		prompt: parseFloat(model.pricing.prompt) || 0,
		completion: parseFloat(model.pricing.completion) || 0,
		model,
	};
}

/**
 * Calculate cost based on token counts and pricing
 */
export function calculateCost(
	inputTokens: number,
	outputTokens: number,
	promptPricePerToken: number,
	completionPricePerToken: number,
): { inputCost: number; outputCost: number; totalCost: number; formatted: string } {
	const inputCost = inputTokens * promptPricePerToken;
	const outputCost = outputTokens * completionPricePerToken;
	const totalCost = inputCost + outputCost;

	return {
		inputCost,
		outputCost,
		totalCost,
		formatted: formatCost(totalCost),
	};
}

/**
 * Format cost as a readable string
 */
export function formatCost(cost: number): string {
	if (cost === 0) {
		return '$0.00';
	}

	if (cost < 0.000001) {
		return `$${cost.toExponential(2)}`;
	}

	if (cost < 0.01) {
		return `$${cost.toFixed(6)}`;
	}

	if (cost < 1) {
		return `$${cost.toFixed(4)}`;
	}

	return `$${cost.toFixed(2)}`;
}

/**
 * Build the result object for the node output
 */
export function buildTokenCostResult(params: {
	model: string;
	modelName?: string;
	inputTokens: number;
	outputTokens: number;
	promptPricePerToken: number;
	completionPricePerToken: number;
	source: 'generation_api' | 'models_api' | 'manual';
	generationId?: string;
	provider?: string;
	latency?: number;
	finishReason?: string;
	cachedTokens?: number;
	reasoningTokens?: number;
	totalCostOverride?: number;
}): TokenCostResult {
	const costs = calculateCost(
		params.inputTokens,
		params.outputTokens,
		params.promptPricePerToken,
		params.completionPricePerToken,
	);

	// Use override if provided (from generation API which gives exact cost)
	if (params.totalCostOverride !== undefined) {
		costs.totalCost = params.totalCostOverride;
		costs.formatted = formatCost(params.totalCostOverride);
	}

	return {
		model: params.model,
		modelName: params.modelName,
		tokens: {
			input: params.inputTokens,
			output: params.outputTokens,
			total: params.inputTokens + params.outputTokens,
			cached: params.cachedTokens,
			reasoning: params.reasoningTokens,
		},
		costs,
		pricing: {
			promptPricePerToken: params.promptPricePerToken,
			completionPricePerToken: params.completionPricePerToken,
			promptPricePerMillion: params.promptPricePerToken * 1_000_000,
			completionPricePerMillion: params.completionPricePerToken * 1_000_000,
			source: params.source,
		},
		metadata: {
			timestamp: new Date().toISOString(),
			generationId: params.generationId,
			provider: params.provider,
			latency: params.latency,
			finishReason: params.finishReason,
		},
	};
}

/**
 * Extract token usage from input data (supports multiple formats)
 */
export function extractTokenUsage(data: IDataObject): {
	model?: string;
	inputTokens?: number;
	outputTokens?: number;
	generationId?: string;
} {
	const result: {
		model?: string;
		inputTokens?: number;
		outputTokens?: number;
		generationId?: string;
	} = {};

	// Extract model
	if (typeof data.model === 'string') {
		result.model = data.model;
	}

	// Extract generation ID
	if (typeof data.id === 'string') {
		result.generationId = data.id;
	}

	// Extract token usage - support multiple formats
	const usage = data.usage as IDataObject | undefined;
	if (usage) {
		// OpenRouter / OpenAI format
		if (typeof usage.prompt_tokens === 'number') {
			result.inputTokens = usage.prompt_tokens;
		}
		if (typeof usage.completion_tokens === 'number') {
			result.outputTokens = usage.completion_tokens;
		}

		// Alternative format (Anthropic-style)
		if (typeof usage.input_tokens === 'number') {
			result.inputTokens = usage.input_tokens;
		}
		if (typeof usage.output_tokens === 'number') {
			result.outputTokens = usage.output_tokens;
		}
	}

	// Try direct properties if usage object not found
	if (result.inputTokens === undefined && typeof data.prompt_tokens === 'number') {
		result.inputTokens = data.prompt_tokens;
	}
	if (result.outputTokens === undefined && typeof data.completion_tokens === 'number') {
		result.outputTokens = data.completion_tokens;
	}

	return result;
}
