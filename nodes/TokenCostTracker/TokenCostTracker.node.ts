import type {
	IDataObject,
	IExecuteFunctions,
	ILoadOptionsFunctions,
	INodeExecutionData,
	INodePropertyOptions,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';
import { NodeOperationError } from 'n8n-workflow';

import {
	getModelsWithPricing,
	getGenerationStats,
	findModelPricing,
	buildTokenCostResult,
	extractTokenUsage,
} from './GenericFunctions';

import { disclaimerBlocks } from '../shared/Disclaimers';

export class TokenCostTracker implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Token Cost Tracker',
		name: 'tokenCostTracker',
		icon: 'file:tokenCostTracker.svg',
		group: ['transform'],
		version: 1,
		subtitle: '={{$parameter["operation"]}}',
		description: 'Track and calculate OpenRouter AI API token costs',
		defaults: {
			name: 'Token Cost Tracker',
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
			{
				displayName: 'Operation',
				name: 'operation',
				type: 'options',
				noDataExpression: true,
				options: [
					{
						name: 'From Input Data',
						value: 'fromInputData',
						description: 'Calculate cost from previous node output (model + usage)',
						action: 'Calculate cost from input data',
					},
					{
						name: 'From Generation ID',
						value: 'fromGenerationId',
						description: 'Get exact cost from OpenRouter generation ID (most accurate)',
						action: 'Get cost from generation ID',
					},
					{
						name: 'Manual Input',
						value: 'manual',
						description: 'Manually enter model and token counts',
						action: 'Calculate cost manually',
					},
				],
				default: 'fromInputData',
			},

			// === From Generation ID mode ===
			{
				displayName: 'Generation ID',
				name: 'generationId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['fromGenerationId'],
					},
				},
				default: '',
				placeholder: 'gen-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
				description:
					'The generation ID from OpenRouter response. This is the "id" field in the API response.',
			},

			// === Manual mode ===
			{
				displayName: 'Model',
				name: 'model',
				type: 'options',
				typeOptions: {
					loadOptionsMethod: 'getModels',
				},
				required: true,
				displayOptions: {
					show: {
						operation: ['manual'],
					},
				},
				default: '',
				description: 'Select the model used for the request',
			},
			{
				displayName: 'Input Tokens',
				name: 'inputTokens',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['manual'],
					},
				},
				default: 0,
				description: 'Number of input (prompt) tokens',
			},
			{
				displayName: 'Output Tokens',
				name: 'outputTokens',
				type: 'number',
				required: true,
				displayOptions: {
					show: {
						operation: ['manual'],
					},
				},
				default: 0,
				description: 'Number of output (completion) tokens',
			},

			// === Options for all modes ===
			{
				displayName: 'Options',
				name: 'options',
				type: 'collection',
				placeholder: 'Add Option',
				default: {},
				options: [
					{
						displayName: 'Include Raw Response',
						name: 'includeRawResponse',
						type: 'boolean',
						default: false,
						description: 'Whether to include the raw API response in the output',
					},
					{
						displayName: 'Pass Through Input',
						name: 'passThroughInput',
						type: 'boolean',
						default: true,
						description: 'Whether to include the original input data in the output',
					},
				],
			},
		],
	};

	methods = {
		loadOptions: {
			async getModels(this: ILoadOptionsFunctions): Promise<INodePropertyOptions[]> {
				const models = await getModelsWithPricing.call(this);

				return models
					.map((model) => ({
						name: `${model.name} (${model.id})`,
						value: model.id,
						description: `Prompt: $${(parseFloat(model.pricing.prompt) * 1_000_000).toFixed(2)}/M, Completion: $${(parseFloat(model.pricing.completion) * 1_000_000).toFixed(2)}/M`,
					}))
					.sort((a, b) => a.name.localeCompare(b.name));
			},
		},
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();
		const returnData: INodeExecutionData[] = [];

		const operation = this.getNodeParameter('operation', 0) as string;

		for (let i = 0; i < items.length; i++) {
			try {
				const options = this.getNodeParameter('options', i, {}) as {
					includeRawResponse?: boolean;
					passThroughInput?: boolean;
				};

				let result;
				let rawResponse;

				if (operation === 'fromGenerationId') {
					// Get exact cost from generation API
					const generationId = this.getNodeParameter('generationId', i) as string;

					if (!generationId) {
						throw new NodeOperationError(
							this.getNode(),
							'Generation ID is required',
							{ itemIndex: i },
						);
					}

					const stats = await getGenerationStats.call(this, generationId);
					rawResponse = stats;

					// Get model pricing for reference
					const models = await getModelsWithPricing.call(this);
					const pricing = findModelPricing(models, stats.model);

					result = buildTokenCostResult({
						model: stats.model,
						modelName: pricing?.model.name,
						inputTokens: stats.nativeTokensPrompt || stats.tokensPrompt,
						outputTokens: stats.nativeTokensCompletion || stats.tokensCompletion,
						promptPricePerToken: pricing?.prompt || 0,
						completionPricePerToken: pricing?.completion || 0,
						source: 'generation_api',
						generationId: stats.id,
						provider: stats.providerName,
						latency: stats.latency,
						finishReason: stats.finishReason,
						cachedTokens: stats.nativeTokensCached,
						reasoningTokens: stats.nativeTokensReasoning,
						totalCostOverride: stats.totalCost,
					});
				} else if (operation === 'fromInputData') {
					// Extract token usage from input data
					const inputData = items[i].json;
					const extracted = extractTokenUsage(inputData);

					if (!extracted.model) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not find "model" field in input data. Make sure the previous node returns a "model" property.',
							{ itemIndex: i },
						);
					}

					if (extracted.inputTokens === undefined || extracted.outputTokens === undefined) {
						throw new NodeOperationError(
							this.getNode(),
							'Could not find token usage in input data. Make sure the previous node returns "usage.prompt_tokens" and "usage.completion_tokens" (or "usage.input_tokens" and "usage.output_tokens").',
							{ itemIndex: i },
						);
					}

					// Get pricing from models API
					const models = await getModelsWithPricing.call(this);
					const pricing = findModelPricing(models, extracted.model);

					if (!pricing) {
						throw new NodeOperationError(
							this.getNode(),
							`Model "${extracted.model}" not found in OpenRouter models list. Please check if the model ID is correct.`,
							{ itemIndex: i },
						);
					}

					result = buildTokenCostResult({
						model: extracted.model,
						modelName: pricing.model.name,
						inputTokens: extracted.inputTokens,
						outputTokens: extracted.outputTokens,
						promptPricePerToken: pricing.prompt,
						completionPricePerToken: pricing.completion,
						source: 'models_api',
						generationId: extracted.generationId,
					});
				} else if (operation === 'manual') {
					// Manual input
					const modelId = this.getNodeParameter('model', i) as string;
					const inputTokens = this.getNodeParameter('inputTokens', i) as number;
					const outputTokens = this.getNodeParameter('outputTokens', i) as number;

					// Get pricing from models API
					const models = await getModelsWithPricing.call(this);
					const pricing = findModelPricing(models, modelId);

					if (!pricing) {
						throw new NodeOperationError(
							this.getNode(),
							`Model "${modelId}" not found in OpenRouter models list.`,
							{ itemIndex: i },
						);
					}

					result = buildTokenCostResult({
						model: modelId,
						modelName: pricing.model.name,
						inputTokens,
						outputTokens,
						promptPricePerToken: pricing.prompt,
						completionPricePerToken: pricing.completion,
						source: 'manual',
					});
				}

				// Build output
				const outputJson: Record<string, unknown> = {};

				// Pass through original input if enabled
				if (options.passThroughInput !== false) {
					Object.assign(outputJson, items[i].json);
				}

				// Add cost tracking result
				outputJson.tokenCost = result;

				// Add raw response if enabled
				if (options.includeRawResponse && rawResponse) {
					outputJson.rawResponse = rawResponse;
				}

				const executionData = this.helpers.constructExecutionMetaData(
					this.helpers.returnJsonArray(outputJson as unknown as IDataObject),
					{ itemData: { item: i } },
				);
				returnData.push(...executionData);
			} catch (error) {
				if (this.continueOnFail()) {
					const executionData = this.helpers.constructExecutionMetaData(
						this.helpers.returnJsonArray({ error: (error as Error).message } as IDataObject),
						{ itemData: { item: i } },
					);
					returnData.push(...executionData);
					continue;
				}
				throw error;
			}
		}

		return [returnData];
	}
}
