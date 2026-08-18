/**
 * 无序列表规则
 *
 * @author COOSONWEI
 */


import { RULE_PRIORITIES } from "../../../command/priority";
import { ParsingContext } from "../../../core/state";
import { Token, TokenType } from "../../../tokens/token";
import { BaseBlockRule } from "./base";

export class ListRule extends BaseBlockRule {
    private unorderedRegex = /^([ \t]*)([-\*\+])\s+(.*)/;
    private orderedRegex = /^([ \t]*)(\d+)\.\s+(.*)/;
    private static MAX_NESTING_LEVEL = 5; // 最大嵌套层级

    constructor() {
        super(RULE_PRIORITIES.LIST); // p<list<h
    }


    static isListLine(line: string): boolean {
        return /^([ \t]*)([-\*\+])\s+(.*)/.test(line) || /^([ \t]*)(\d+)\.\s+(.*)/.test(line);
    }

    match(line: string, _ctx: ParsingContext): boolean {
        return ListRule.isListLine(line);
    }


    execute(line: string, ctx: ParsingContext): Token[] {
        const tokens: Token[] = [];
        let match: RegExpMatchArray | null;
        let indent: number;
        let isOrdered: boolean;

        if ((match = line.match(this.unorderedRegex))) {
            indent = match[1].length;
            isOrdered = false;
        } else if ((match = line.match(this.orderedRegex))) {
            indent = match[1].length;
            isOrdered = true;
        } else {
            return [];
        }

        if (ctx.isInParagraph) {
            tokens.push(new Token({ type: TokenType.PARAGRAPH_CLOSE, tag: 'p', nesting: -1, block: true }));
            ctx.setInParagraph(false);
        }

        const content = match[3];
        let currentLevel = ctx.currentListLevel;

        // 处理缩进减少，先关闭已经离开的列表层级
        while (currentLevel > 0 && indent < ctx.getCurrentListIndent()) {
            if (ctx.isCurrentListItemOpen) {
                tokens.push(new Token({ type: TokenType.LIST_ITEM_CLOSE, tag: 'li', nesting: -1, block: true }));
                ctx.closeListItem();
            }
            const closingTag = ctx.getCurrentListTag() ?? 'ul';
            tokens.push(new Token({
                type: TokenType.LIST_CLOSE,
                tag: closingTag,
                nesting: -1,
                block: true,
            }));
            ctx.leaveListLevel();
            currentLevel = ctx.currentListLevel;
        }

        // 达到最大层级时，将更深缩进作为当前层级处理，避免丢失文本
        if (currentLevel >= ListRule.MAX_NESTING_LEVEL && indent > ctx.getCurrentListIndent()) {
            indent = ctx.getCurrentListIndent();
        }

        if (currentLevel === 0 || indent > ctx.getCurrentListIndent()) {
            ctx.enterListLevel(indent, isOrdered ? 'ol' : 'ul');
            tokens.push(new Token({
                type: TokenType.LIST_OPEN,
                tag: isOrdered ? 'ol' : 'ul',
                nesting: 1,
                block: true,
                level: currentLevel,
            }));
        } else if (indent === ctx.getCurrentListIndent()) {
            if (ctx.getCurrentListTag() !== (isOrdered ? 'ol' : 'ul')) {
                if (ctx.isCurrentListItemOpen) {
                    tokens.push(new Token({ type: TokenType.LIST_ITEM_CLOSE, tag: 'li', nesting: -1, block: true }));
                    ctx.closeListItem();
                }
                tokens.push(new Token({
                    type: TokenType.LIST_CLOSE,
                    tag: ctx.getCurrentListTag() ?? 'ul',
                    nesting: -1,
                    block: true,
                }));
                ctx.leaveListLevel();
                ctx.enterListLevel(indent, isOrdered ? 'ol' : 'ul');
                tokens.push(new Token({
                    type: TokenType.LIST_OPEN,
                    tag: isOrdered ? 'ol' : 'ul',
                    nesting: 1,
                    block: true,
                    level: currentLevel,
                }));
            } else if (ctx.isCurrentListItemOpen) {
                tokens.push(new Token({ type: TokenType.LIST_ITEM_CLOSE, tag: 'li', nesting: -1, block: true }));
                ctx.closeListItem();
            }
        }

        // 添加当前列表项
        tokens.push(
            new Token({type: TokenType.LIST_ITEM_OPEN, tag: 'li', nesting: 1, block: true}),
            ...this.parseInlineContent(content.trim()),
        );
        ctx.openListItem();

        return tokens;
    }

}
