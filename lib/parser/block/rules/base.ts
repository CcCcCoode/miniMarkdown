
/**
 * 块级解析规则基类
 */

import { Token, TokenType } from "../../../tokens/token";
import { InlineParser } from "../../inline";
import { BlockRule } from "../state";


export abstract class BaseBlockRule extends BlockRule {
    private readonly inlineParser = new InlineParser();

    protected constructor(priority: number) {
      super({ priority });
    }
  
    // 统一生成块级规则使用的行内容器
    protected parseInlineContent(text: string): Token[] {
      return [new Token({
        type: TokenType.INLINE,
        content: text,
        children: this.inlineParser.parse(text),
      })];
    }
  }
