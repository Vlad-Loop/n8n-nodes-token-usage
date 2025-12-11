import { INodeProperties } from 'n8n-workflow';

const disclaimerBlocks: INodeProperties[] = [
	{
		displayName:
			'<b>Community Node</b><br/>This is not an official OpenRouter product. All rights to trademarks, logos and other designations belong to their legal owners. This node was created by an independent developer for tracking AI API costs.',
		name: 'unofficialWarning',
		type: 'notice',
		default: '',
	},
	{
		displayName:
			'<b>Disclaimer</b><br/>This software is provided "as is", without any express or implied warranties. Cost calculations are estimates based on OpenRouter API data. Always verify costs in your OpenRouter dashboard. The author is not responsible for any billing discrepancies.',
		name: 'disclaimer',
		type: 'notice',
		default: '',
	},
];

export { disclaimerBlocks };