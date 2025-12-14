/**
 * OpenRouter model pricing information
 */
export interface OpenRouterModelPricing {
	prompt: string;
	completion: string;
	request?: string;
	image?: string;
}

/**
 * OpenRouter model object from API
 */
export interface OpenRouterModel {
	id: string;
	name: string;
	pricing: OpenRouterModelPricing;
	[key: string]: unknown;
}

/**
 * OpenRouter models API response
 */
export interface OpenRouterModelsResponse {
	data: OpenRouterModel[];
}

/**
 * Input LLM call from TokenUsage
 */
export interface InputLLMCall {
	nodeName: string;
	tokenUsage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	} | null;
	model: string | null;
	messages: string[];
	estimatedTokens: number;
}

/**
 * Input from TokenUsage node
 */
export interface TokenUsageOutput {
	execution_id: string;
	totalTokenUsage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	};
	llmCalls: InputLLMCall[];
}

/**
 * Cost breakdown for a single LLM call
 */
export interface CostBreakdown {
	promptCost: number;
	completionCost: number;
	totalCost: number;
	currency: 'USD';
}

/**
 * Extended LLM call with cost information
 */
export interface LLMCallWithCost extends InputLLMCall {
	cost: CostBreakdown;
}

/**
 * Extended output with pricing information
 */
export interface AutoPriceCalculatorOutput extends TokenUsageOutput {
	llmCalls: LLMCallWithCost[];
	totalCost: CostBreakdown;
}
