import { Token, TokenType } from '../../tokens/token';

/** 将扁平 Token 流渲染为安全的 HTML。 */
export function renderTokens(tokens: Token[]): string {
    return tokens.map(renderToken).join('');
}

function renderToken(token: Token): string {
    switch (token.type) {
        case TokenType.TEXT:
            return escapeHtml(token.content ?? '');
        case TokenType.INLINE:
            return token.children.length > 0
                ? renderTokens(token.children)
                : escapeHtml(token.content ?? '');
        case TokenType.CODE_INLINE:
            return `<code>${escapeHtml(token.content ?? '')}</code>`;
        case TokenType.HARD_BREAK:
            return '<br>';
        case TokenType.STRONG_OPEN:
            return '<strong>';
        case TokenType.STRONG_CLOSE:
            return '</strong>';
        case TokenType.EMPHASIS_OPEN:
            return '<em>';
        case TokenType.EMPHASIS_CLOSE:
            return '</em>';
        case TokenType.STRIKETHROUGH_OPEN:
            return '<del>';
        case TokenType.STRIKETHROUGH_CLOSE:
            return '</del>';
        case TokenType.LINK_OPEN:
            return openingTag('a', token.attrs);
        case TokenType.LINK_CLOSE:
            return '</a>';
        case TokenType.IMAGE_OPEN:
            return openingTag('img', token.attrs);
        case TokenType.IMAGE_CLOSE:
            return '';
        case TokenType.PARAGRAPH_OPEN:
            return '<p>';
        case TokenType.PARAGRAPH_CLOSE:
            return '</p>';
        case TokenType.HEADING_OPEN:
            return openingTag(headingTag(token.tag));
        case TokenType.HEADING_CLOSE:
            return `</${headingTag(token.tag)}>`;
        case TokenType.LIST_OPEN:
            return openingTag(listTag(token.tag));
        case TokenType.LIST_CLOSE:
            return `</${listTag(token.tag)}>`;
        case TokenType.LIST_ITEM_OPEN:
            return '<li>';
        case TokenType.LIST_ITEM_CLOSE:
            return '</li>';
        case TokenType.BLOCKQUOTE_OPEN:
            return '<blockquote>';
        case TokenType.BLOCKQUOTE_CLOSE:
            return '</blockquote>';
        case TokenType.TABLE_OPEN:
            return '<table>';
        case TokenType.TABLE_CLOSE:
            return '</table>';
        case TokenType.TABLE_HEADER_OPEN:
            return '<thead>';
        case TokenType.TABLE_HEADER_CLOSE:
            return '</thead>';
        case TokenType.TABLE_BODY_OPEN:
            return '<tbody>';
        case TokenType.TABLE_BODY_CLOSE:
            return '</tbody>';
        case TokenType.TABLE_ROW_OPEN:
            return '<tr>';
        case TokenType.TABLE_ROW_CLOSE:
            return '</tr>';
        case TokenType.TABLE_CELL_OPEN:
            return openingTag(tableCellTag(token.tag), token.attrs);
        case TokenType.TABLE_CELL_CLOSE:
            return `</${tableCellTag(token.tag)}>`;
        case TokenType.HORIZONTAL_RULE:
            return '<hr>';
        default:
            return '';
    }
}

function openingTag(tag: string, attrs?: Record<string, string>): string {
    const attributes = Object.entries(attrs ?? {})
        .filter(([name]) => /^[A-Za-z_:][A-Za-z0-9:_.-]*$/.test(name))
        .map(([name, value]) => ` ${name}="${escapeHtml(value)}"`)
        .join('');
    return `<${tag}${attributes}>`;
}

function headingTag(tag: string | undefined): string {
    return tag && /^h[1-6]$/.test(tag) ? tag : 'h1';
}

function listTag(tag: string | undefined): string {
    return tag === 'ol' ? 'ol' : 'ul';
}

function tableCellTag(tag: string | undefined): string {
    return tag === 'th' ? 'th' : 'td';
}

function escapeHtml(value: string): string {
    return value.replace(/[&<>"']/g, (character) => {
        switch (character) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#39;';
            default: return character;
        }
    });
}
