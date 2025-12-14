import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import type {
	OpenRouterModelsResponse,
	OpenRouterModel,
	TokenUsageOutput,
	LLMCallWithCost,
	CostBreakdown,
	AutoPriceCalculatorOutput,
	InputLLMCall,
} from './types';

import { disclaimerBlocks } from '../shared/Disclaimers';

/**
 * Fetch pricing data from OpenRouter API and create a lookup map
 */
async function fetchPricingData(
	context: IExecuteFunctions,
	baseUrl: string,
	apiKey: string,
): Promise<Map<string, OpenRouterModel>> {
	const url = `${baseUrl}/models`;

	const response = (await context.helpers.httpRequest({
		method: 'GET',
		url,
		headers: {
			Authorization: `Bearer ${apiKey}`,
			Accept: 'application/json',
		},
		json: true,
	})) as OpenRouterModelsResponse;

	if (!response?.data || !Array.isArray(response.data)) {
		throw new Error('Invalid response from OpenRouter API');
	}

	// Create a map for quick model lookup
	const pricingMap = new Map<string, OpenRouterModel>();
	for (const model of response.data) {
		if (model.id) {
			pricingMap.set(model.id, model);
		}
	}

	return pricingMap;
}

/**
 * Calculate cost for a single LLM call
 */
function calculateCost(
	call: InputLLMCall,
	pricingMap: Map<string, OpenRouterModel>,
): CostBreakdown {
	const zeroCost: CostBreakdown = {
		promptCost: 0,
		completionCost: 0,
		totalCost: 0,
		currency: 'USD',
	};

	// If no model or no token usage, return zero cost
	if (!call.model || !call.tokenUsage) {
		return zeroCost;
	}

	// Try to find the model in pricing data
	const modelPricing = pricingMap.get(call.model);

	// If model not found, return zero cost
	if (!modelPricing || !modelPricing.pricing) {
		return zeroCost;
	}

	// Parse pricing (stored as string decimals)
	const promptPricePerToken = parseFloat(modelPricing.pricing.prompt) || 0;
	const completionPricePerToken =
		parseFloat(modelPricing.pricing.completion) || 0;

	// If both prices are 0 (free model), return zero cost
	if (promptPricePerToken === 0 && completionPricePerToken === 0) {
		return zeroCost;
	}

	// Calculate costs
	const promptCost = call.tokenUsage.promptTokens * promptPricePerToken;
	const completionCost =
		call.tokenUsage.completionTokens * completionPricePerToken;
	const totalCostValue = promptCost + completionCost;

	return {
		promptCost: Math.round(promptCost * 1e8) / 1e8,
		completionCost: Math.round(completionCost * 1e8) / 1e8,
		totalCost: Math.round(totalCostValue * 1e8) / 1e8,
		currency: 'USD',
	};
}

export class AutoPriceCalculator implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Token Cost (OpenRouter)',
		name: 'tokenCostOpenRouter',
		icon: {
			light: 'file:autoPriceCalculatorWhite.png',
			dark: 'file:autoPriceCalculatorBlack.png',
		},
		group: ['transform'],
		version: 1,
		subtitle: 'Calculate LLM costs using OpenRouter pricing',
		description:
			'Calculates the cost of LLM token usage using OpenRouter pricing data. Requires model names to match OpenRouter model IDs.',
		defaults: {
			name: 'Token Cost (OpenRouter)',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'openRouterApi',
				required: true,
			},
		],
		properties: [
			...disclaimerBlocks,
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		// Get OpenRouter API credentials
		const credentials = await this.getCredentials('openRouterApi');
		const apiKey = credentials.apiKey as string;
		const baseUrl = (credentials.url as string).replace(/\/+$/, '');

		if (!apiKey) {
			throw new Error('OpenRouter API key is required');
		}

		// Fetch pricing data from OpenRouter
		let pricingMap: Map<string, OpenRouterModel>;
		try {
			pricingMap = await fetchPricingData(this, baseUrl, apiKey);
		} catch (error) {
			throw new Error(
				`Failed to fetch pricing data: ${(error as Error).message}`,
			);
		}

		// Process each input item
		for (let itemIndex = 0; itemIndex < items.length; itemIndex++) {
			const item = items[itemIndex];
			const inputData = item.json as unknown as TokenUsageOutput;

			// Validate input has required structure
			if (!inputData.llmCalls || !Array.isArray(inputData.llmCalls)) {
				// If no llmCalls, pass through with zero costs
				const output: IDataObject = {
					...inputData,
					totalCost: {
						promptCost: 0,
						completionCost: 0,
						totalCost: 0,
						currency: 'USD',
					},
				};
				returnData.push({ json: output });
				continue;
			}

			// Calculate costs for each LLM call
			const llmCallsWithCost: LLMCallWithCost[] = inputData.llmCalls.map(
				(call) => {
					const cost = calculateCost(call, pricingMap);
					return {
						...call,
						cost,
					};
				},
			);

			// Calculate total cost across all calls
			const totalCost: CostBreakdown = {
				promptCost: llmCallsWithCost.reduce(
					(sum, call) => sum + call.cost.promptCost,
					0,
				),
				completionCost: llmCallsWithCost.reduce(
					(sum, call) => sum + call.cost.completionCost,
					0,
				),
				totalCost: llmCallsWithCost.reduce(
					(sum, call) => sum + call.cost.totalCost,
					0,
				),
				currency: 'USD',
			};

			// Build output
			const output: AutoPriceCalculatorOutput = {
				...inputData,
				llmCalls: llmCallsWithCost,
				totalCost,
			};

			returnData.push({
				json: output as unknown as IDataObject,
				pairedItem: { item: itemIndex },
			});
		}

		return [returnData];
	}
}
