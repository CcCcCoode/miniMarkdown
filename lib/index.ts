// Markdown 解析器公共 API。

import { MarkdownParser, type MarkdownParserOptions } from './core/parser';
import { Token, TokenType } from './tokens/token';
import { InlineParser } from './parser/inline';
import { renderTokens } from './core/renderer/htmlRender';

export { InlineParser, MarkdownParser, renderTokens, Token, TokenType };
export type { MarkdownParserOptions };

/** 将 Markdown 字符串解析为当前的块级 Token 模型。 */
export function parseMarkdown(
    markdown: string,
    options: MarkdownParserOptions = {},
): Token[] {
    return new MarkdownParser(options).parse(markdown);
}
