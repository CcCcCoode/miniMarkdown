import { parseMarkdown, renderTokens, Token, TokenType } from '../lib/index';

describe('HTML Renderer', () => {
  test('渲染块级 Token 和行内 Token', () => {
    const tokens = parseMarkdown([
      '# **标题**',
      '',
      '- 第一项',
      '- 第二项',
      '',
      '> 引用',
      '',
      '普通段落',
    ].join('\n'));

    expect(renderTokens(tokens)).toBe(
      '<h1><strong>标题</strong></h1><ul><li>第一项</li><li>第二项</li></ul><blockquote>引用</blockquote><p>普通段落</p>',
    );
  });

  test('渲染表格和自闭合元素', () => {
    const tokens = parseMarkdown([
      '| 表头 |',
      '| --- |',
      '| 单元格 |',
      '',
      '---',
    ].join('\n'));

    expect(renderTokens(tokens)).toBe(
      '<table><thead><tr><th>表头</th></tr></thead><tbody><tr><td style="text-align: center">单元格</td></tr></tbody></table><hr>',
    );
  });

  test('转义文本和 HTML 属性，阻止原始 HTML 执行', () => {
    const tokens = [
      new Token({ type: TokenType.TEXT, content: '<script>alert("x")</script> & "文本"' }),
      new Token({
        type: TokenType.LINK_OPEN,
        tag: 'a',
        attrs: { href: '" onmouseover="alert(1)' },
        nesting: 1,
      }),
      new Token({ type: TokenType.TEXT, content: '链接' }),
      new Token({ type: TokenType.LINK_CLOSE, tag: 'a', nesting: -1 }),
    ];

    expect(renderTokens(tokens)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &quot;文本&quot;<a href="&quot; onmouseover=&quot;alert(1)">链接</a>',
    );
  });

  test('渲染链接、图片、代码和硬换行', () => {
    const tokens = parseMarkdown('[链接](url) ![图片](img.png) `代码`  \\');

    expect(renderTokens(tokens)).toBe(
      '<p><a href="url">链接</a> <img src="img.png" alt="图片"> <code>代码</code>  <br></p>',
    );
  });

  test('忽略未知 Token，不把用户内容当作标签执行', () => {
    expect(renderTokens([
      new Token({ type: 'unknown', tag: 'script', content: 'alert(1)' }),
    ])).toBe('');
  });
});
