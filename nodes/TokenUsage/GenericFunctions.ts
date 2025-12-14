import type {
	ExtractedLLMData,
	N8nExecutionResponse,
	N8nNodeRunData,
} from './types';

/**
 * Extract LLM token usage data from execution response
 * Looks for ai_languageModel outputs which contain tokenUsage
 */
export function extractLLMDataFromExecution(
	execution: N8nExecutionResponse | null,
): ExtractedLLMData[] {
	const results: ExtractedLLMData[] = [];

	if (!execution?.data?.resultData?.runData) {
		return results;
	}

	const runData = execution.data.resultData.runData;

	for (const nodeName of Object.keys(runData)) {
		const nodeRuns = runData[nodeName];
		if (!Array.isArray(nodeRuns)) continue;

		for (const run of nodeRuns as N8nNodeRunData[]) {
			// Check for ai_languageModel output (LLM nodes)
			const aiLMData = run.data?.ai_languageModel;
			if (aiLMData && Array.isArray(aiLMData)) {
				for (const outputArray of aiLMData) {
					if (!Array.isArray(outputArray)) continue;

					for (const output of outputArray) {
						const json = output?.json;
						if (!json) continue;

						// Extract token usage
						const tokenUsage = json.tokenUsage;
						if (tokenUsage) {
							// Get model, messages, estimatedTokens from inputOverride
							let model: string | null = null;
							let messages: string[] = [];
							let estimatedTokens = 0;

							const inputOverride = run.inputOverride?.ai_languageModel;
							if (inputOverride && Array.isArray(inputOverride)) {
								for (const overrideArray of inputOverride) {
									if (!Array.isArray(overrideArray)) continue;
									for (const override of overrideArray) {
										const overrideJson = override?.json;
										if (!overrideJson) continue;

										// Extract model
										if (!model && overrideJson.options?.model) {
											model = String(overrideJson.options.model);
										}

										// Extract messages
										if (overrideJson.messages && Array.isArray(overrideJson.messages)) {
											messages = overrideJson.messages.map((m: unknown) => String(m));
										}

										// Extract estimatedTokens
										if (typeof overrideJson.estimatedTokens === 'number') {
											estimatedTokens = overrideJson.estimatedTokens;
										}
									}
								}
							}

							results.push({
								nodeName,
								model,
								tokenUsage: {
									promptTokens: Number(tokenUsage.promptTokens ?? 0),
									completionTokens: Number(tokenUsage.completionTokens ?? 0),
									totalTokens: Number(tokenUsage.totalTokens ?? 0),
								},
								messages,
								estimatedTokens,
							});
						}
					}
				}
			}
		}
	}

	return results;
}
