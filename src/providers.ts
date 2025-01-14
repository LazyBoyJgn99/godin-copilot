import axios from 'axios';
import { AIModelConfig, AIProvider } from './types';

export class DeepseekProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        console.log('Deepseek请求配置:', {
            url: 'https://api.deepseek.com/beta/completions',
            model: config.model.replace('deepseek/', ''),
            apiKeyLength: config.apiKey.length
        });

        try {
            const response = await axios({
                method: 'post',
                maxBodyLength: Infinity,
                url: 'https://api.deepseek.com/beta/completions',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                data: {
                    model: "deepseek-coder",
                    prompt: prompt,
                    suffix: "",  // 可选的后缀
                    max_tokens: 4096,
                    temperature: 0.3,
                    top_p: 0.95,
                    frequency_penalty: 0,
                    presence_penalty: 0,
                    stop: null,
                    echo: false,
                    stream: false
                }
            });

            return response.data.choices[0].text.trim();
        } catch (error: any) {
            console.error('Deepseek响应错误:', error.response?.data || error.message);
            throw new Error(this.getErrorMessage(error));
        }
    }

    private getErrorMessage(error: any): string {
        if (error.response) {
            const status = error.response.status;
            const data = error.response.data;
            
            switch (status) {
                case 401:
                    return '无效的API密钥，请检查密钥格式是否正确';
                case 403:
                    return '没有访问权限，请确认API密钥已启用';
                case 429:
                    return '请求太频繁，请稍后再试';
                default:
                    return `请求失败 (${status}): ${data.error?.message || data.message || error.message}`;
            }
        }
        return `请求失败: ${error.message}`;
    }
}

export class ZhipuProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        try {
            const response = await axios({
                method: 'post',
                url: `${config.baseUrl || 'https://open.bigmodel.cn/api/paas/v3'}/chat/completions`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                data: {
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
                }
            });

            return response.data.choices[0].message.content.trim();
        } catch (error: any) {
            console.error('智谱API响应错误:', error.response?.data || error.message);
            throw new Error(`智谱API请求失败: ${error.response?.statusText || error.message}`);
        }
    }
}

export class BaiduProvider implements AIProvider {
    async generateCompletion(prompt: string, config: AIModelConfig): Promise<string> {
        try {
            const response = await axios({
                method: 'post',
                url: `${config.baseUrl || 'https://aip.baidubce.com/rpc/2.0/ai_custom/v1/wenxinworkshop'}/code_chat`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.apiKey}`
                },
                data: {
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
                }
            });

            return response.data.result.trim();
        } catch (error: any) {
            console.error('百度API响应错误:', error.response?.data || error.message);
            throw new Error(`百度API请求失败: ${error.response?.statusText || error.message}`);
        }
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