// Markdown 解析器公共 API。

import { MarkdownParser, type MarkdownParserOptions } from './core/parser';
import { Token, TokenType } from './tokens/token';
import { InlineParser } from './parser/inline';

export { InlineParser, MarkdownParser, Token, TokenType };
export type { MarkdownParserOptions };

/** 将 Markdown 字符串解析为当前的块级 Token 模型。 */
export function parseMarkdown(
    markdown: string,
    options: MarkdownParserOptions = {},
): Token[] {
    return new MarkdownParser(options).parse(markdown);
}
