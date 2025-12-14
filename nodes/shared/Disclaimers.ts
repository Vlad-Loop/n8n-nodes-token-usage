import { INodeProperties } from 'n8n-workflow';

const disclaimerBlocks: INodeProperties[] = [
	{
		displayName:
			'<b>This is not an official n8n Community Node!</b><br/>This project is not affiliated with n8n GmbH or OpenRouter. Pricing data is fetched from OpenRouter API and may change without notice. Always verify costs in your provider\'s dashboard.',
		name: 'unofficialWarning',
		type: 'notice',
		default: '',
	},
	{
		displayName:
			'<b>Disclaimer</b><br/>This software is provided "as is", without any express or implied warranties. The author is not responsible for any losses arising from the use of this software, including inaccurate cost calculations. Use at your own risk.',
		name: 'disclaimer',
		type: 'notice',
		default: '',
	},
];

export { disclaimerBlocks };