// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { getAIProvider } from './providers';

interface AIModelConfig {
	model: string;
	apiKey: string;
	baseUrl: string;
}

interface AIProvider {
	generateCompletion(prompt: string, config: AIModelConfig): Promise<string>;
}

interface LanguageConfig {
	language: string;
	prompt: string;
}

export const LANGUAGE_PROMPTS: Record<string, string> = {
	'typescript': '请用TypeScript实现以下功能：',
	'javascript': '请用JavaScript实现以下功能：',
	'python': '请用Python实现以下功能：',
	'java': '请用Java实现以下功能：',
	'go': '请用Go实现以下功能：',
	'rust': '请用Rust实现以下功能：',
	'default': '请实现以下功能：'
};

const CONTEXT_LINES = 5; // 获取上下文的行数

function getConfiguration(): AIModelConfig {
	const config = vscode.workspace.getConfiguration('godinCopilot');
	const model = config.get<string>('model') || 'deepseek/deepseek-coder-33b-instruct';
	const baseUrl = config.get<string>('baseUrl') || '';

	return {
		model,
		apiKey: config.get<string>('apiKey') || '',
		baseUrl
	};
}

// 添加API密钥验证函数
async function validateApiKey(config: AIModelConfig): Promise<{ isValid: boolean; error?: string }> {
	try {
		const provider = getAIProvider(config.model);
		if (!config.apiKey) {
			return { isValid: false, error: '请先配置API密钥' };
		}
		
		if (!/^[a-zA-Z0-9_-]+$/.test(config.apiKey)) {
			return { isValid: false, error: 'API密钥格式不正确' };
		}

		console.log('开始验证API密钥...');
		await provider.generateCompletion('// 测试API连接\nfunction test() {\n', config);
		console.log('API密钥验证成功');
		return { isValid: true };
	} catch (error: any) {
		console.error('API密钥验证失败:', error);
		console.log('错误详情:', error.message);
		let errorMessage = '验证失败';
		
		if (error.message.includes('401')) {
			errorMessage = 'API密钥无效';
		} else if (error.message.includes('403')) {
			errorMessage = 'API密钥没有访问权限';
		} else if (error.message.includes('429')) {
			errorMessage = 'API调用次数超限';
		} else {
			errorMessage = `验证失败: ${error.message}`;
		}
		
		return { isValid: false, error: errorMessage };
	}
}

// 获取当前编辑器的语言
function getEditorLanguage(editor: vscode.TextEditor): string {
	return editor.document.languageId.toLowerCase();
}

// 根据语言生成优化的提示词
function getLanguageSpecificPrompt(language: string, text: string, context: string): string {
	const prompt = LANGUAGE_PROMPTS[language] || LANGUAGE_PROMPTS.default;
	return `${prompt}\n上下文代码：\n${context}\n需要处理的部分：\n${text}`;
}

// 在现有函数之后添加新的上下文获取函数
function getCodeContext(editor: vscode.TextEditor, selection: vscode.Selection): string {
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

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	console.log('Godin Copilot 已激活');

	// 注册扩写命令
	let disposable = vscode.commands.registerCommand('godin-copilot.expand', async () => {
		const editor = vscode.window.activeTextEditor;
		if (!editor) {
			vscode.window.showErrorMessage('请先打开一个文件');
			return;
		}

		// 获取配置
		const config = getConfiguration();
		const validation = await validateApiKey(config);
		if (!validation.isValid) {
			vscode.window.showErrorMessage(`API密钥验证失败: ${validation.error}`);
			return;
		}

		try {
			// 获取选中的文本或当前行
			const selection = editor.selection;
			const text = editor.document.getText(selection) || editor.document.lineAt(selection.start.line).text;
			
			// 获取代码上下文
			const context = getCodeContext(editor, selection);
			const language = getEditorLanguage(editor);
			const optimizedPrompt = getLanguageSpecificPrompt(language, text, context);

			// 显示加载状态
			const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
			statusBarItem.text = "$(sync~spin) 正在生成代码...";
			statusBarItem.show();

			// 调用AI生成代码
			const provider = getAIProvider(config.model);
			const completion = await provider.generateCompletion(optimizedPrompt, config);

			// 插入生成的代码
			await editor.edit(editBuilder => {
				if (selection.isEmpty) {
					// 如果没有选中文本，在当前行后插入
					const position = new vscode.Position(selection.start.line + 1, 0);
					editBuilder.insert(position, '\n' + completion);
				} else {
					// 替换选中的文本
					editBuilder.replace(selection, completion);
				}
			});

			// 在插入代码后添加格式化
			if (completion) {
				await vscode.commands.executeCommand('editor.action.formatDocument');
			}

			statusBarItem.hide();
		} catch (error) {
			vscode.window.showErrorMessage(`生成代码失败: ${error}`);
		}
	});

	context.subscriptions.push(disposable);
}

// this method is called when your extension is deactivated
export function deactivate() {}
