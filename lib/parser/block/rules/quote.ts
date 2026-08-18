import { RULE_PRIORITIES } from "../../../command/priority";
import { ParsingContext } from "../../../core/state";
import { Token, TokenType } from "../../../tokens/token";
import { BaseBlockRule } from "./base";

/**
 * 引用规则
 *
 * @author COOSONWEI
 */
export class BlockQuoteRule extends BaseBlockRule {
    private static regex = /^(\>+)\s*(.*)/; // 正则表达式

    static isQuoteLine(line: string): boolean {
        return BlockQuoteRule.regex.test(line);
    }

    constructor() {
        super(RULE_PRIORITIES.BLOCKQUOTE); // p < 优先级 < list
    }

    match(line: string, ctx: ParsingContext): boolean {
        console.log('BlockQuote match:', BlockQuoteRule.regex.test(line), line);
        return BlockQuoteRule.regex.test(line);
    }

    execute(line: string, ctx: ParsingContext): Token[] {
        const match = line.match(BlockQuoteRule.regex)!;
        const level = match[1].length; // 计算引用层级
        const content = match[2];
        const tokens: Token[] = [];

        // 重置段落状态
        if (ctx.isInParagraph) {
            tokens.push(new Token({ type: TokenType.PARAGRAPH_CLOSE, tag: 'p', nesting: -1, block: true }));
        }
        ctx.setInParagraph(false);

        // 处理层级嵌套
        while (ctx.currentQuoteLevel > level) {
            tokens.push(this.createCloseToken(ctx.currentQuoteLevel));
            ctx.leaveQuoteLevel();
        }

        // 打开新层级
        while (ctx.currentQuoteLevel < level) {
            ctx.enterQuoteLevel();
            tokens.push(this.createOpenToken(ctx.currentQuoteLevel));
        }

        // 添加内容
        tokens.push(
            new Token({
                type: TokenType.INLINE,
                content: content,
                children: this.parseInlineContent(content),
                block: true
            })
        );

        return tokens;
    }

    // 创建开始层级
    private createOpenToken(level: number): Token {
        return new Token({
            type: TokenType.BLOCKQUOTE_OPEN,
            tag: 'blockquote',
            nesting: 1,
            block: true,
            level: level
        });
    }

    // 创建关闭层级
    private createCloseToken(level: number): Token {
        return new Token({
            type: TokenType.BLOCKQUOTE_CLOSE,
            tag: 'blockquote',
            nesting: -1,
            block: true,
            level: level
        });
    }
}
