import { parseMarkdown, TokenType } from '../lib/index';

describe('public Markdown API', () => {
  test('parses a paragraph through the public entry point', () => {
    const tokens = parseMarkdown('Hello');

    expect(tokens.map((token) => token.type)).toEqual([
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
    ]);
    expect(tokens[1].content).toBe('Hello');
    expect(tokens[1].children[0].content).toBe('Hello');
  });

  test('supports parser options without exposing CLI side effects', () => {
    const tokens = parseMarkdown('# Hello', { debug: false });

    expect(tokens[0].type).toBe(TokenType.HEADING_OPEN);
    expect(tokens[0].tag).toBe('h1');
  });
});
