import { expect } from 'chai';
import * as vscode from 'vscode';
import { getLanguageSpecificPrompt, getCodeContext } from '../../utils';

describe('Utils Tests', () => {
    describe('getLanguageSpecificPrompt', () => {
        it('should return correct prompt for known language', () => {
            const result = getLanguageSpecificPrompt('typescript', 'test code', 'context');
            expect(result).to.include('TypeScript');
            expect(result).to.include('test code');
        });

        it('should return default prompt for unknown language', () => {
            const result = getLanguageSpecificPrompt('unknown', 'test code', 'context');
            expect(result).to.include('请实现以下功能');
        });
    });

    // 添加更多测试...
}); 