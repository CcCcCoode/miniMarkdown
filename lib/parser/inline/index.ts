import { Token, TokenType } from '../../tokens/token';

/**
 * 将一段块级文本解析为扁平的行内 Token 流。
 */
export class InlineParser {
    parse(source: string): Token[] {
        const { content, hardBreak } = this.extractHardBreak(source);
        const tokens = this.parseContent(content);

        if (hardBreak) {
            tokens.push(new Token({
                type: TokenType.HARD_BREAK,
                tag: 'br',
                nesting: 0,
                markup: hardBreak,
            }));
        }

        return tokens;
    }

    private parseContent(source: string): Token[] {
        const tokens: Token[] = [];
        let position = 0;

        while (position < source.length) {
            const escaped = this.readEscape(source, position);
            if (escaped) {
                this.appendText(tokens, escaped.content);
                position = escaped.end;
                continue;
            }

            const image = this.readImage(source, position);
            if (image) {
                tokens.push(...image.tokens);
                position = image.end;
                continue;
            }

            const link = this.readLink(source, position);
            if (link) {
                tokens.push(...link.tokens);
                position = link.end;
                continue;
            }

            const code = this.readCode(source, position);
            if (code) {
                tokens.push(...code.tokens);
                position = code.end;
                continue;
            }

            const strong = this.readDelimited(source, position, ['**', '__'], TokenType.STRONG_OPEN, TokenType.STRONG_CLOSE, 'strong');
            if (strong) {
                tokens.push(...strong.tokens);
                position = strong.end;
                continue;
            }
            const unmatchedStrong = ['**', '__'].find((delimiter) => source.startsWith(delimiter, position));
            if (unmatchedStrong) {
                this.appendText(tokens, unmatchedStrong);
                position += unmatchedStrong.length;
                continue;
            }

            const strikethrough = this.readDelimited(source, position, ['~~'], TokenType.STRIKETHROUGH_OPEN, TokenType.STRIKETHROUGH_CLOSE, 'del');
            if (strikethrough) {
                tokens.push(...strikethrough.tokens);
                position = strikethrough.end;
                continue;
            }
            if (source.startsWith('~~', position)) {
                this.appendText(tokens, '~~');
                position += 2;
                continue;
            }

            const emphasis = this.readDelimited(source, position, ['*', '_'], TokenType.EMPHASIS_OPEN, TokenType.EMPHASIS_CLOSE, 'em');
            if (emphasis) {
                tokens.push(...emphasis.tokens);
                position = emphasis.end;
                continue;
            }

            this.appendText(tokens, source[position]);
            position++;
        }

        return tokens;
    }

    private readEscape(source: string, position: number): ParsedText | null {
        if (source[position] !== '\\' || position + 1 >= source.length) {
            return null;
        }

        const next = source[position + 1];
        if (!/[!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~]/.test(next)) {
            return null;
        }

        return { content: next, end: position + 2 };
    }

    private readCode(source: string, position: number): ParsedTokens | null {
        if (source[position] !== '`') {
            return null;
        }

        const end = this.findUnescaped(source, '`', position + 1);
        if (end < 0) {
            return null;
        }

        return {
            tokens: [new Token({
                type: TokenType.CODE_INLINE,
                tag: 'code',
                content: source.slice(position + 1, end),
                markup: '`',
            })],
            end: end + 1,
        };
    }

    private readDelimited(
        source: string,
        position: number,
        delimiters: string[],
        openType: TokenType,
        closeType: TokenType,
        tag: string,
    ): ParsedTokens | null {
        const delimiter = delimiters.find((candidate) => source.startsWith(candidate, position));
        if (!delimiter) {
            return null;
        }

        const end = this.findUnescaped(source, delimiter, position + delimiter.length);
        if (end <= position + delimiter.length) {
            return null;
        }

        const content = source.slice(position + delimiter.length, end);
        return {
            tokens: [
                new Token({ type: openType, tag, nesting: 1, markup: delimiter }),
                ...this.parseContent(content),
                new Token({ type: closeType, tag, nesting: -1, markup: delimiter }),
            ],
            end: end + delimiter.length,
        };
    }

    private readLink(source: string, position: number): ParsedTokens | null {
        if (source[position] !== '[') {
            return null;
        }

        const target = this.readLinkTarget(source, position + 1);
        if (!target) {
            return null;
        }

        const label = source.slice(position + 1, target.labelEnd);
        return {
            tokens: [
                new Token({ type: TokenType.LINK_OPEN, tag: 'a', attrs: { href: target.destination }, nesting: 1, markup: '[]()' }),
                ...this.parseContent(label),
                new Token({ type: TokenType.LINK_CLOSE, tag: 'a', nesting: -1, markup: '[]()' }),
            ],
            end: target.end,
        };
    }

    private readImage(source: string, position: number): ParsedTokens | null {
        if (!source.startsWith('![', position)) {
            return null;
        }

        const target = this.readLinkTarget(source, position + 2);
        if (!target) {
            return null;
        }

        const alt = source.slice(position + 2, target.labelEnd);
        return {
            tokens: [
                new Token({
                    type: TokenType.IMAGE_OPEN,
                    tag: 'img',
                    attrs: { src: target.destination, alt },
                    nesting: 1,
                    markup: '![]()',
                }),
                new Token({ type: TokenType.IMAGE_CLOSE, tag: 'img', nesting: -1, markup: '![]()' }),
            ],
            end: target.end,
        };
    }

    private readLinkTarget(source: string, labelStart: number): LinkTarget | null {
        const labelEnd = this.findUnescaped(source, '](', labelStart);
        if (labelEnd < 0) {
            return null;
        }

        const destinationStart = labelEnd + 2;
        const destinationEnd = this.findUnescaped(source, ')', destinationStart);
        if (destinationEnd < 0 || destinationEnd === destinationStart) {
            return null;
        }

        return {
            labelEnd,
            destination: this.unescapePunctuation(source.slice(destinationStart, destinationEnd)),
            end: destinationEnd + 1,
        };
    }

    private findUnescaped(source: string, delimiter: string, start: number): number {
        let position = source.indexOf(delimiter, start);
        while (position >= 0) {
            let slashCount = 0;
            for (let index = position - 1; index >= 0 && source[index] === '\\'; index--) {
                slashCount++;
            }
            if (slashCount % 2 === 0) {
                return position;
            }
            position = source.indexOf(delimiter, position + delimiter.length);
        }
        return -1;
    }

    private extractHardBreak(source: string): { content: string; hardBreak?: string } {
        const spaces = source.match(/ {2,}$/);
        if (spaces) {
            return { content: source.slice(0, -spaces[0].length), hardBreak: spaces[0] };
        }

        let slashCount = 0;
        for (let index = source.length - 1; index >= 0 && source[index] === '\\'; index--) {
            slashCount++;
        }
        if (slashCount % 2 === 1) {
            return { content: source.slice(0, -1), hardBreak: '\\' };
        }

        return { content: source };
    }

    private unescapePunctuation(source: string): string {
        return source.replace(/\\([!"#$%&'()*+,\-.\/:;<=>?@[\\\]^_`{|}~])/g, '$1');
    }

    private appendText(tokens: Token[], content: string): void {
        const previous = tokens[tokens.length - 1];
        if (previous?.type === TokenType.TEXT) {
            previous.content = `${previous.content ?? ''}${content}`;
            return;
        }
        tokens.push(new Token({ type: TokenType.TEXT, content }));
    }
}

interface ParsedText {
    content: string;
    end: number;
}

interface ParsedTokens {
    tokens: Token[];
    end: number;
}

interface LinkTarget {
    labelEnd: number;
    destination: string;
    end: number;
}
