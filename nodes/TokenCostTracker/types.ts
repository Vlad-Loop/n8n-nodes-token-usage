// OpenRouter API response types

export interface OpenRouterModelPricing {
	prompt: string;
	completion: string;
	request: string;
	image: string;
	web_search?: string;
	internal_reasoning?: string;
	input_cache_read?: string;
	input_cache_write?: string;
}

export interface OpenRouterModel {
	id: string;
	name: string;
	pricing: OpenRouterModelPricing;
	context_length: number;
	architecture?: {
		modality: string;
		input_modalities: string[];
		output_modalities: string[];
		tokenizer: string;
		instruct_type: string;
	};
}

export interface OpenRouterModelsResponse {
	data: OpenRouterModel[];
}

// Generation stats from /api/v1/generation endpoint
export interface GenerationStats {
	id: string;
	model: string;
	status: string;
	totalCost: number;
	cost_usd?: number;
	upstreamInferenceCost?: number;
	createdAt: string;
	tokensPrompt: number;
	tokensCompletion: number;
	nativeTokensPrompt: number;
	nativeTokensCompletion: number;
	nativeTokensReasoning?: number;
	nativeTokensCached?: number;
	latency?: number;
	generationTime?: number;
	finishReason?: string;
	providerName?: string;
}

// Token usage from input data
export interface TokenUsage {
	prompt_tokens?: number;
	completion_tokens?: number;
	total_tokens?: number;
	// Alternative naming (some providers use these)
	input_tokens?: number;
	output_tokens?: number;
}

// Input data structure from previous node (e.g., OpenRouter Chat)
export interface OpenRouterChatResponse {
	id?: string;
	model?: string;
	usage?: TokenUsage;
	choices?: Array<{
		message?: {
			content?: string;
			role?: string;
		};
		finish_reason?: string;
	}>;
}

// Output of our node
export interface TokenCostResult {
	model: string;
	modelName?: string;
	tokens: {
		input: number;
		output: number;
		total: number;
		cached?: number;
		reasoning?: number;
	};
	costs: {
		inputCost: number;
		outputCost: number;
		totalCost: number;
		formatted: string;
	};
	pricing: {
		promptPricePerToken: number;
		completionPricePerToken: number;
		promptPricePerMillion: number;
		completionPricePerMillion: number;
		source: 'generation_api' | 'models_api' | 'manual';
	};
	metadata: {
		timestamp: string;
		generationId?: string;
		provider?: string;
		latency?: number;
		finishReason?: string;
	};
}
