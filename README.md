# 字节再爱我一次 520 团队
## MiniMarkDownEditor项目开发

我们将会在这里记录我们的开发过程以及更新日志

## MiniMarkDownEditor

MiniMarkDownEditor 是一个基于 Vue 3 和 TypeScript 的 Markdown 编辑器，同时提供可独立使用的 Markdown Token 解析和安全 HTML 渲染 API。

## 当前完成状态

- 块级解析：段落、标题、无序/有序列表、嵌套列表、引用、表格、水平线
- 行内解析：普通文本、转义、粗体、斜体、删除线、行内代码、链接、图片、硬换行
- HTML 渲染：扁平 Token 流、安全文本和属性转义、自闭合元素
- Vue 编辑器：实时预览、清空、复制、导出、本地草稿保存和错误提示
- 工程化：Jest 测试、严格 TypeScript 检查、Vite 构建和 GitHub Actions CI

当前明确未实现的 Markdown 能力包括代码块、脚注、任务列表和完整 CommonMark 兼容性。

## TODO 清单

- [x] 完成 Token 的结构定义
- [x] 完成块级解析器基础功能
- [x] 完成行内语法解析
- [x] 完成 HTML Renderer
- [x] 完成 Vue 编辑器接入
- [x] 完成严格类型检查、测试命令和 CI 构建检查
- [ ] 支持代码块、脚注和任务列表
- [ ] 提升 CommonMark 兼容性

## 公共 API

```ts
import { parseMarkdown, renderTokens } from './lib/index';

const tokens = parseMarkdown('# Hello **Markdown**');
const html = renderTokens(tokens);
```

`renderTokens` 只把解析得到的白名单 Token 渲染为 HTML，文本和属性会自动转义，不执行用户输入中的原始 HTML。

## 开发命令

```bash
npm ci
npm run dev
npm test
npm run typecheck
npm run build
npm run check
```

## 目录说明

- `lib/core/parser.ts`：块级解析入口
- `lib/parser/inline/index.ts`：行内解析器
- `lib/core/renderer/htmlRender.ts`：HTML Renderer
- `lib/tokens/token.ts`：公共 Token 类型和结构
- `src/App.vue`：Vue 编辑器界面
- `test/`：解析器和 Renderer 测试

## 更新日志

#### 2025-02-17

@author COOSONWEI 完成了项目基础的架构划分，具体如下：

```text
core/       核心系统入口和基础类型定义
  parser.ts
  renderer/htmlRender.ts
  state.ts
parser/     解析器具体实现
  block/
  inline/
  main.ts
plugins/    插件注册与管理
rules/      规则管理
tokens/     Token 数据结构与处理逻辑
utils/      通用工具函数
```

#### 2025-02-18

@author COOSONWEI 实现基础解析流程与段落/空行处理（p 标签实现）。

#### 2025-02-22

@author COOSONWEI 实现 h 标签解析。

#### 2025-02-23

@author COOSONWEI 实现 list 标签解析（ul、ol）。

#### 2025-02-24

@author COOSONWEI 实现引用标签解析。

#### 2026-08-18

完成块级状态修复、行内解析、HTML Renderer、Vue 编辑器接入和工程化检查。
