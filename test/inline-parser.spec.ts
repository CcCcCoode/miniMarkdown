import { InlineParser, parseMarkdown, TokenType } from '../lib/index';
import { Token } from '../lib/tokens/token';

function types(tokens: Token[]): string[] {
  return tokens.map((token) => token.type);
}

describe('InlineParser', () => {
  const parser = new InlineParser();

  test('合并普通文本并处理转义字符', () => {
    const tokens = parser.parse('普通文本 \\*不是斜体\\* \\x');

    expect(types(tokens)).toEqual([TokenType.TEXT]);
    expect(tokens[0].content).toBe('普通文本 *不是斜体* \\x');
  });

  test.each([
    ['**粗体**', TokenType.STRONG_OPEN, TokenType.STRONG_CLOSE, 'strong'],
    ['*斜体*', TokenType.EMPHASIS_OPEN, TokenType.EMPHASIS_CLOSE, 'em'],
    ['~~删除~~', TokenType.STRIKETHROUGH_OPEN, TokenType.STRIKETHROUGH_CLOSE, 'del'],
  ])('解析成对样式标记 %s', (source, openType, closeType, tag) => {
    const tokens = parser.parse(source);

    expect(types(tokens)).toEqual([openType, TokenType.TEXT, closeType]);
    expect(tokens[0]).toMatchObject({ tag, nesting: 1 });
    expect(tokens[1].content).toBe(source.replace(/^\*\*|\*\*$|^\*|\*$|^~~|~~$/g, ''));
    expect(tokens[2]).toMatchObject({ tag, nesting: -1 });
  });

  test('行内代码不继续解析内部标记', () => {
    const tokens = parser.parse('执行 `**code**`');

    expect(types(tokens)).toEqual([TokenType.TEXT, TokenType.CODE_INLINE]);
    expect(tokens[1]).toMatchObject({ tag: 'code', content: '**code**', markup: '`' });
  });

  test('解析链接标签中的组合语法', () => {
    const tokens = parser.parse('[**文档**](https://example.com/a\\)b)');

    expect(types(tokens)).toEqual([
      TokenType.LINK_OPEN,
      TokenType.STRONG_OPEN,
      TokenType.TEXT,
      TokenType.STRONG_CLOSE,
      TokenType.LINK_CLOSE,
    ]);
    expect(tokens[0].attrs).toEqual({ href: 'https://example.com/a)b' });
  });

  test('图片优先于链接并保存地址和替代文本', () => {
    const tokens = parser.parse('![预览图](preview.png)');

    expect(types(tokens)).toEqual([TokenType.IMAGE_OPEN, TokenType.IMAGE_CLOSE]);
    expect(tokens[0]).toMatchObject({
      tag: 'img',
      attrs: { src: 'preview.png', alt: '预览图' },
      nesting: 1,
    });
  });

  test.each(['文本  ', '文本\\'])('解析硬换行 %s', (source) => {
    const tokens = parser.parse(source);

    expect(types(tokens)).toEqual([TokenType.TEXT, TokenType.HARD_BREAK]);
    expect(tokens[0].content).toBe('文本');
    expect(tokens[1].tag).toBe('br');
  });

  test('支持样式和链接嵌套组合', () => {
    const tokens = parser.parse('**粗体 ~~删除~~ [链接](url)**');

    expect(types(tokens)).toEqual([
      TokenType.STRONG_OPEN,
      TokenType.TEXT,
      TokenType.STRIKETHROUGH_OPEN,
      TokenType.TEXT,
      TokenType.STRIKETHROUGH_CLOSE,
      TokenType.TEXT,
      TokenType.LINK_OPEN,
      TokenType.TEXT,
      TokenType.LINK_CLOSE,
      TokenType.STRONG_CLOSE,
    ]);
  });

  test.each([
    '**未闭合',
    '*未闭合',
    '~~未闭合',
    '`未闭合',
    '[未闭合](url',
    '![未闭合](image.png',
  ])('未闭合标记按普通文本保留: %s', (source) => {
    const tokens = parser.parse(source);

    expect(types(tokens)).toEqual([TokenType.TEXT]);
    expect(tokens[0].content).toBe(source);
  });

  test('未闭合双字符标记不会借用后续单字符标记', () => {
    const source = '**未闭合，后面有 *独立斜体*';
    const tokens = parser.parse(source);

    expect(types(tokens)).toEqual([
      TokenType.TEXT,
      TokenType.EMPHASIS_OPEN,
      TokenType.TEXT,
      TokenType.EMPHASIS_CLOSE,
    ]);
    expect(tokens[0].content).toBe('**未闭合，后面有 ');
    expect(tokens[2].content).toBe('独立斜体');
  });
});

describe('块级规则的行内解析接入', () => {
  test('段落、标题、列表、引用和表格统一生成 INLINE 容器', () => {
    const markdown = [
      '# **标题**',
      '',
      '段落 *内容*',
      '',
      '- ~~列表~~',
      '',
      '> `引用`',
      '',
      '| **表头** |',
      '| --- |',
      '| [单元格](url) |',
    ].join('\n');
    const inlineTokens = parseMarkdown(markdown).filter((token) => token.type === TokenType.INLINE);

    expect(inlineTokens.map((token) => token.content)).toEqual([
      '**标题**',
      '段落 *内容*',
      '~~列表~~',
      '`引用`',
      '**表头**',
      '[单元格](url)',
    ]);
    expect(inlineTokens.every((token) => token.children.length > 0)).toBe(true);
    expect(inlineTokens.map((token) => token.children[0].type)).toEqual([
      TokenType.STRONG_OPEN,
      TokenType.TEXT,
      TokenType.STRIKETHROUGH_OPEN,
      TokenType.CODE_INLINE,
      TokenType.STRONG_OPEN,
      TokenType.LINK_OPEN,
    ]);
  });
});
