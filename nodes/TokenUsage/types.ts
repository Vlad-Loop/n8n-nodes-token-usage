/**
 * n8n Execution API response
 */
export interface N8nExecutionResponse {
	id: string;
	finished: boolean;
	status: string;
	workflowId: string;
	data?: {
		resultData?: {
			runData?: Record<string, N8nNodeRunData[]>;
		};
	};
	[key: string]: unknown;
}

/**
 * Node run data from execution API
 */
export interface N8nNodeRunData {
	executionStatus: string;
	data?: {
		main?: Array<Array<{ json: unknown }>>;
		ai_languageModel?: Array<Array<{ json: LLMNodeOutput }>>;
	};
	inputOverride?: {
		ai_languageModel?: Array<Array<{ json: LLMInputOverride }>>;
	};
	[key: string]: unknown;
}

/**
 * LLM node output with token usage
 */
export interface LLMNodeOutput {
	response?: unknown;
	tokenUsage?: {
		promptTokens?: number;
		completionTokens?: number;
		totalTokens?: number;
	};
	[key: string]: unknown;
}

/**
 * LLM input override with model info
 */
export interface LLMInputOverride {
	messages?: string[];
	estimatedTokens?: number;
	options?: {
		model?: string;
		[key: string]: unknown;
	};
	[key: string]: unknown;
}

/**
 * Extracted LLM data from execution
 */
export interface ExtractedLLMData {
	nodeName: string;
	model: string | null;
	tokenUsage: {
		promptTokens: number;
		completionTokens: number;
		totalTokens: number;
	} | null;
	messages: string[];
	estimatedTokens: number;
}
