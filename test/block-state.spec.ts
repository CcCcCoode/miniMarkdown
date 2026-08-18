import { MarkdownParser, parseMarkdown, TokenType } from '../lib/index';

function tokenShape(markdown: string) {
  return parseMarkdown(markdown).map((token) => ({
    type: token.type,
    tag: token.tag,
    content: token.content,
  }));
}

describe('block state model', () => {
  test('keeps same-level list items in one list', () => {
    expect(tokenShape('- a\n- b')).toEqual([
      { type: TokenType.LIST_OPEN, tag: 'ul', content: undefined },
      { type: TokenType.LIST_ITEM_OPEN, tag: 'li', content: undefined },
      { type: TokenType.INLINE, tag: undefined, content: 'a' },
      { type: TokenType.LIST_ITEM_CLOSE, tag: 'li', content: undefined },
      { type: TokenType.LIST_ITEM_OPEN, tag: 'li', content: undefined },
      { type: TokenType.INLINE, tag: undefined, content: 'b' },
      { type: TokenType.LIST_ITEM_CLOSE, tag: 'li', content: undefined },
      { type: TokenType.LIST_CLOSE, tag: 'ul', content: undefined },
    ]);
  });

  test('nests lists inside the parent list item', () => {
    const shapes = tokenShape('- a\n  - b\n- c');
    expect(shapes.map((token) => token.type)).toEqual([
      TokenType.LIST_OPEN,
      TokenType.LIST_ITEM_OPEN,
      TokenType.INLINE,
      TokenType.LIST_OPEN,
      TokenType.LIST_ITEM_OPEN,
      TokenType.INLINE,
      TokenType.LIST_ITEM_CLOSE,
      TokenType.LIST_CLOSE,
      TokenType.LIST_ITEM_CLOSE,
      TokenType.LIST_ITEM_OPEN,
      TokenType.INLINE,
      TokenType.LIST_ITEM_CLOSE,
      TokenType.LIST_CLOSE,
    ]);
  });

  test('switches list type without mixing containers', () => {
    expect(tokenShape('- a\n1. b').map((token) => token.tag)).toEqual([
      'ul', 'li', undefined, 'li', 'ul', 'ol', 'li', undefined, 'li', 'ol',
    ]);
  });

  test('closes a list before a following paragraph', () => {
    expect(tokenShape('- a\ntext').map((token) => token.type)).toEqual([
      TokenType.LIST_OPEN,
      TokenType.LIST_ITEM_OPEN,
      TokenType.INLINE,
      TokenType.LIST_ITEM_CLOSE,
      TokenType.LIST_CLOSE,
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
    ]);
  });

  test('merges continuous quotes and closes them before text', () => {
    expect(tokenShape('> a\n> b\ntext').map((token) => token.type)).toEqual([
      TokenType.BLOCKQUOTE_OPEN,
      TokenType.INLINE,
      TokenType.INLINE,
      TokenType.BLOCKQUOTE_CLOSE,
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
    ]);
  });

  test('handles nested quote levels', () => {
    expect(tokenShape('> a\n>> b\n> c').map((token) => token.type)).toEqual([
      TokenType.BLOCKQUOTE_OPEN,
      TokenType.INLINE,
      TokenType.BLOCKQUOTE_OPEN,
      TokenType.INLINE,
      TokenType.BLOCKQUOTE_CLOSE,
      TokenType.INLINE,
      TokenType.BLOCKQUOTE_CLOSE,
    ]);
  });

  test('closes a paragraph before headings and horizontal rules', () => {
    expect(tokenShape('text\n# heading\nnext\n---').map((token) => token.type)).toEqual([
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
      TokenType.HEADING_OPEN,
      TokenType.INLINE,
      TokenType.HEADING_CLOSE,
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
      TokenType.HORIZONTAL_RULE,
    ]);
  });

  test('normalizes CRLF and closes blocks at EOF', () => {
    const tokens = parseMarkdown('- a\r\n  - b');
    expect(tokens.filter((token) => token.type === TokenType.INLINE).map((token) => token.content)).toEqual(['a', 'b']);
    expect(tokens[tokens.length - 1].type).toBe(TokenType.LIST_CLOSE);
  });

  test('resets all block state between parse calls', () => {
    const parser = new MarkdownParser();
    const parserTokens = parser.parse('- a');
    expect(parserTokens[parserTokens.length - 1].type).toBe(TokenType.LIST_CLOSE);
    expect(parser.parse('plain').map((token) => token.type)).toEqual([
      TokenType.PARAGRAPH_OPEN,
      TokenType.INLINE,
      TokenType.PARAGRAPH_CLOSE,
    ]);
  });
});
