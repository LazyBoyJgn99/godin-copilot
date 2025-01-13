import fetch, { Response } from 'node-fetch';
import { AIModelConfig, AIProvider } from './types';

export class DeepseekProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        console.log('Deepseek请求配置:', {
            url: `${config.baseUrl || 'https://api.deepseek.com/v1'}/chat/completions`,
            model: config.model.replace('deepseek/', ''),
            apiKeyLength: config.apiKey.length
        });

        const response = await fetch(`${config.baseUrl || 'https://api.deepseek.com/v1'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'api-key': config.apiKey
            },
            body: JSON.stringify({
                model: config.model.replace('deepseek/', ''),
                messages: [
                    {
                        role: 'system',
                        content: '你是一个专业的代码助手，专注于代码生成和补全。请根据用户的描述或代码提供准确的代码实现。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            const errorMessage = await this.getErrorMessage(response);
            console.error('Deepseek响应错误:', {
                status: response.status,
                statusText: response.statusText,
                errorMessage
            });
            throw new Error(errorMessage);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }

    private async getErrorMessage(response: Response): Promise<string> {
        try {
            const errorData = await response.json();
            console.log('API错误详情:', errorData);
            switch (response.status) {
                case 401:
                    return '无效的API密钥，请检查密钥格式是否正确';
                case 403:
                    return '没有访问权限，请确认API密钥已启用';
                case 429:
                    return '请求太频繁，请稍后再试';
                default:
                    return `请求失败 (${response.status}): ${errorData.error?.message || errorData.message || response.statusText}`;
            }
        } catch (error) {
            console.error('解析错误响应失败:', error);
            return `请求失败 (${response.status}: ${response.statusText})`;
        }
    }
}

export class ZhipuProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        const response = await fetch(`${config.baseUrl || 'https://open.bigmodel.cn/api/paas/v3'}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                model: config.model.replace('zhipu/', ''),
                messages: [
                    {
                        role: 'system',
                        content: '你是一个代码助手，请根据用户的描述或代码补全相应的代码。请直接返回代码，不需要解释。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 2048
            })
        });

        if (!response.ok) {
            throw new Error(`智谱API请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        return data.choices[0].message.content.trim();
    }
}

export class BaiduProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        const response = await fetch(`${config.baseUrl || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop'}/code_chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${config.apiKey}`
            },
            body: JSON.stringify({
                messages: [
                    {
                        role: 'system',
                        content: '你是一个代码助手，请根据用户的描述或代码补全相应的代码。请直接返回代码，不需要解释。'
                    },
                    {
                        role: 'user',
                        content: prompt
                    }
                ],
                temperature: 0.7,
                top_p: 0.8
            })
        });

        if (!response.ok) {
            throw new Error(`百度API请求失败: ${response.statusText}`);
        }

        const data = await response.json();
        return data.result.trim();
    }
}

export function getAIProvider(model: string): AIProvider {
    if (model.startsWith('deepseek/')) {
        return new DeepseekProvider();
    } else if (model.startsWith('zhipu/')) {
        return new ZhipuProvider();
    } else if (model.startsWith('baidu/')) {
        return new BaiduProvider();
    }
    return new DeepseekProvider(); // 默认使用Deepseek
} 