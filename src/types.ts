export interface AIModelConfig {
    model: string;
    apiKey: string;
    baseUrl: string;
}

export interface AIProvider {
    generateCompletion(prompt: string, config: AIModelConfig): Promise<string>;
} 