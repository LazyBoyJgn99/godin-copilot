import * as vscode from 'vscode';
import { LANGUAGE_PROMPTS } from './constants';

export const CONTEXT_LINES = 5; // 获取上下文的行数

export function getLanguageSpecificPrompt(language: string, text: string, context: string): string {
    const prompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.default;
    return `${prompt}\n上下文代码：\n${context}\n需要处理的部分：\n${text}`;
}

export function getCodeContext(editor: vscode.TextEditor, selection: vscode.Selection): string {
    const document = editor.document;
    const startLine = Math.max(0, selection.start.line - CONTEXT_LINES);
    const endLine = Math.min(document.lineCount - 1, selection.end.line + CONTEXT_LINES);
    
    let context = '';
    for (let i = startLine; i <= endLine; i++) {
        const line = document.lineAt(i);
        if (i >= selection.start.line && i <= selection.end.line) {
            context += '// [当前代码]\n' + line.text + '\n';
        } else {
            context += line.text + '\n';
        }
    }
    return context;
}

export function getEditorLanguage(editor: vscode.TextEditor): string {
    return editor.document.languageId.toLowerCase();
} 