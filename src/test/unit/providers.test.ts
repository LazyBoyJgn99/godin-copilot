import { expect } from 'chai';
import * as sinon from 'sinon';
import { DeepseekProvider, ZhipuProvider, BaiduProvider } from '../../providers';

describe('AI Providers Tests', () => {
    let fetchStub: sinon.SinonStub;

    beforeEach(() => {
        // 模拟fetch调用
        fetchStub = sinon.stub(global, 'fetch' as any);
    });

    afterEach(() => {
        fetchStub.restore();
    });

    describe('DeepseekProvider', () => {
        it('should generate completion successfully', async () => {
            const mockResponse = {
                ok: true,
                json: async () => ({
                    choices: [{ message: { content: 'test code' } }]
                })
            };
            fetchStub.resolves(mockResponse);

            const provider = new DeepseekProvider();
            const result = await provider.generateCompletion('test prompt', {
                model: 'deepseek/test-model',
                apiKey: 'test-key',
                baseUrl: 'test-url'
            });

            expect(result).to.equal('test code');
            expect(fetchStub.calledOnce).to.be.true;
        });

        it('should handle API errors', async () => {
            const mockResponse = {
                ok: false,
                statusText: 'API Error'
            };
            fetchStub.resolves(mockResponse);

            const provider = new DeepseekProvider();
            try {
                await provider.generateCompletion('test prompt', {
                    model: 'deepseek/test-model',
                    apiKey: 'test-key',
                    baseUrl: 'test-url'
                });
                expect.fail('Should have thrown an error');
            } catch (error: any) {
                expect(error.message).to.include('API Error');
            }
        });
    });

    // 可以添加更多测试...
}); 