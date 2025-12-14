import type {
	IDataObject,
	IExecuteFunctions,
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
} from 'n8n-workflow';

import { extractLLMDataFromExecution } from './GenericFunctions';
import { disclaimerBlocks } from '../shared/Disclaimers';
import type { N8nExecutionResponse } from './types';

export class TokenUsage implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Token Usage',
		name: 'tokenUsage',
		icon: {
			light: 'file:tokenUsageWhite.png',
			dark: 'file:tokenUsageBlack.png',
		},
		group: ['transform'],
		version: 1,
		subtitle: '={{ $parameter["operation"] === "save" ? "Save Execution ID" : "Get Token Usage" }}',
		description: 'Track LLM token usage from n8n executions',
		defaults: {
			name: 'Token Usage',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'n8nApi',
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
						name: 'Save Execution ID',
						value: 'save',
						description: 'Save current execution ID for later token tracking',
						action: 'Save execution ID',
					},
					{
						name: 'Get Token Usage',
						value: 'fetch',
						description: 'Fetch token usage data from a completed execution',
						action: 'Get token usage',
					},
				],
				default: 'save',
			},
			{
				displayName: 'Execution ID',
				name: 'executionId',
				type: 'string',
				required: true,
				displayOptions: {
					show: {
						operation: ['fetch'],
					},
				},
				default: '',
				placeholder: '={{ $json.execution_id }}',
				description: 'The execution ID to fetch token data from',
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const operation = this.getNodeParameter('operation', 0) as string;

		if (operation === 'save') {
			// Save Execution ID mode
			let executionId: string | null = null;
			try {
				executionId = this.getExecutionId();
			} catch {
				executionId = null;
			}

			const result: IDataObject = {
				execution_id: executionId,
			};

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray(result),
				{ itemData: { item: 0 } },
			);

			return [executionData];
		} else {
			// Get Token Usage mode
			const executionId = this.getNodeParameter('executionId', 0, '') as string;

			if (!executionId) {
				throw new Error('Execution ID is required');
			}

			// Get n8n API credentials
			const credentials = await this.getCredentials('n8nApi');
			const apiKey = credentials.apiKey as string;
			const baseUrl = credentials.baseUrl as string;

			if (!apiKey || !baseUrl) {
				throw new Error('n8n API credentials (apiKey and baseUrl) are required');
			}

			// Normalize base URL
			let normalizedUrl = baseUrl.replace(/\/+$/, '');
			if (!normalizedUrl.includes('/api/v1')) {
				normalizedUrl = `${normalizedUrl}/api/v1`;
			}

			// Fetch execution data
			const url = `${normalizedUrl}/executions/${executionId}?includeData=true`;

			let rawResponse: unknown;
			try {
				rawResponse = await this.helpers.httpRequest({
					method: 'GET',
					url,
					headers: {
						'X-N8N-API-KEY': apiKey,
						accept: 'application/json',
					},
					json: true,
				});
			} catch (err) {
				throw new Error(`Failed to fetch execution data: ${(err as Error).message}`);
			}

			if (!rawResponse) {
				throw new Error('No execution data returned');
			}

			// Parse response - check if it's already an execution object or wrapped in data
			let execution: N8nExecutionResponse;
			const response = rawResponse as Record<string, unknown>;

			// If response has 'id' field, it's already an execution object
			// Otherwise, try to unwrap from 'data' field
			if (response.id !== undefined) {
				execution = response as N8nExecutionResponse;
			} else if (response.data && typeof response.data === 'object') {
				execution = response.data as N8nExecutionResponse;
			} else {
				execution = response as N8nExecutionResponse;
			}

			// Extract LLM token usage
			const llmData = extractLLMDataFromExecution(execution);

			if (llmData.length === 0) {
				return [
					this.helpers.returnJsonArray({
						_warning: 'No token usage data found in this execution',
						execution_id: executionId,
					}),
				];
			}

			// Calculate total tokens across all LLM calls
			let totalPromptTokens = 0;
			let totalCompletionTokens = 0;
			let totalTokens = 0;

			for (const data of llmData) {
				if (data.tokenUsage) {
					totalPromptTokens += data.tokenUsage.promptTokens || 0;
					totalCompletionTokens += data.tokenUsage.completionTokens || 0;
					totalTokens += data.tokenUsage.totalTokens || 0;
				}
			}

			// Return single item with total and detailed breakdown
			const result: IDataObject = {
				execution_id: executionId,
				totalTokenUsage: {
					promptTokens: totalPromptTokens,
					completionTokens: totalCompletionTokens,
					totalTokens: totalTokens,
				},
				llmCalls: llmData.map((data) => ({
					nodeName: data.nodeName,
					tokenUsage: data.tokenUsage,
					model: data.model,
					messages: data.messages,
					estimatedTokens: data.estimatedTokens,
				})),
			};

			const executionData = this.helpers.constructExecutionMetaData(
				this.helpers.returnJsonArray([result]),
				{ itemData: { item: 0 } },
			);

			return [executionData];
		}
	}
}
