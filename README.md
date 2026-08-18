# 字节再爱我一次 520 团队
## MiniMarkDownEditor项目开发
我们将会在这里记录我们的开发过程以及更新日志

## 运行步骤

### 环境要求

- Node.js 22 或更高版本
- npm 10 或更高版本

### 启动开发环境

```bash
# 进入项目目录
cd MiniMarkDownEditor-

# 安装依赖
npm ci

# 启动开发服务器
npm run dev
```

启动成功后，在浏览器访问终端显示的地址，默认地址为：

```text
http://localhost:5173/
```

### 常用命令

```bash
# 运行全部 Jest 测试
npm test

# 执行 Vue 和 lib 的严格 TypeScript 检查
npm run typecheck

# 构建生产版本
npm run build

# 一次执行测试、类型检查和生产构建
npm run check
```

## 当前项目范围

当前项目已经完成 Markdown 编辑器核心能力和 Vue 编辑器接入。

- 输入：Markdown 字符串或编辑器内容
- 输出：块级 Token 数组或安全 HTML
- 支持：块级解析、行内解析、HTML 渲染和实时编辑预览
- 编辑器功能：清空、复制、导出和本地草稿保存

公共入口位于 `lib/index.ts`：

```ts
import { parseMarkdown, renderTokens, TokenType } from './lib/index';

const tokens = parseMarkdown('# Hello **Markdown**');
const html = renderTokens(tokens);
```

解析入口是纯 API，不会在导入时读取 stdin 或产生 CLI 副作用。需要从 stdin 调试时使用独立的 `lib/cli.ts`。

## TODO 清单

- [✔] 第一步：定义解析公共入口和 MVP 范围
- [✔] 第二步：修复块级状态模型
    - [✔] 修复段落、列表、引用之间的状态切换
    - [✔] 支持同级列表复用、嵌套列表和列表类型切换
    - [✔] 支持连续引用、引用嵌套和文档结束自动收尾
    - [✔] 统一处理 LF、CRLF 和 malformed 输入
- [✔] 第三步：实现行内语法解析
    - [✔] 支持普通文本、转义、粗体、斜体和删除线
    - [✔] 支持行内代码、链接、图片和硬换行
    - [✔] 未闭合标记降级为普通文本
- [✔] 第四步：实现 HTML 渲染器
    - [✔] 支持块级 Token、行内 Token、表格和水平线
    - [✔] 导出 `renderTokens(tokens)` 公共 API
    - [✔] 转义文本和 HTML 属性，阻止原始 HTML 执行
- [✔] 第五步：接入 Vue 编辑器
    - [✔] 接入 Markdown 输入、实时预览和错误状态
    - [✔] 支持清空、复制、导出和本地草稿保存
    - [✔] 删除默认 Vite 示例页面并更新基础界面
- [✔] 第六步：完成工程化完善
    - [✔] 增加 Jest、严格 TypeScript 检查、Vite 构建和 CI 检查
    - [✔] 清理未接入的 command、空壳管理器和重复接口定义
    - [✔] 更新开发命令和项目文档
- [ ] 后续扩展：代码块、脚注、任务列表和更完整的 CommonMark 兼容性

## 更新日志
#### 2025-02-17 <br>
  @author COOSONWEI 完成了项目基础的架构划分具体如下：<br>
├── core # 核心系统入口和基础类型定义 <br>
│   ├── parser.ts # 解析器集成<br>
│   ├── renderer # 渲染器功能实现 <br>
│   │   └── htmlRender.ts <br>
│   ├── state.ts # 解析器上下文<br>
│   └── types # 接口定义<br>
│       ├── parser.interface.ts <br>
│       ├── renderer.interface.ts <br>
│       └── token.interface.ts <br>
├── index.ts # lib入口文件 <br>
├── parser # 解析器具体实现 <br>
│   ├── block # 块级解析 <br>
│   │   ├── index.ts <br>
│   │   ├── rules # 块级规则目录 <br>
│   │   └── state.ts # 块级状态机 <br>
│   ├── inline # 行级解析 <br>
│   │   ├── index.ts <br>
│   │   ├── rules # 行级规则目录 <br>
│   │   └── state.ts # 行级状态机 <br>
│   └── main.ts # 解析器 main 函数<br>
├── plugins # 插件注册与管理 <br>
│   └── manager.ts <br>
├── rules #规则管理 <br>
│   ├── base.ts # 基础规则接口<br>
│   └── manager.ts # 规则管理<br>
├── tokens # Token 数据结构与处理逻辑<br>
│   └── token.ts <br>
└── utils # 通用工具函数<br>
    ├── cache.ts <br>
    └── regex.ts # 正则表达式预编译<br>
#### 2025-02-18 <br>
  @author COOSONWEI 实现基础解析流程与段落/空行处理（p 标签实现）;
#### 2025-02-22 <br>
  @author COOSONWEI 实现 h 标签解析;
#### 2025-02-23 <br>
  @author COOSONWEI 实现 list 标签解析（ul 、 ol ）;
#### 2025-02-24 <br>
  @author COOSONWEI 实现  引用 标签解析（ul 、 ol ）;
#### 2026-08-18 <br>
  @author CcCcCoode 完成项目六个阶段的完善工作：<br>
  1. 完成解析公共入口和最小实现目标范围定义；<br>
  2. 修复块级状态切换、列表嵌套、引用合并和文档结束收尾；<br>
  3. 实现独立行内解析器，支持行内 Markdown 语法和 malformed 降级；<br>
  4. 实现安全 HTML Renderer，支持 Token 渲染和内容转义；<br>
  5. 接入 Vue 编辑器，实现实时预览、草稿保存、复制和导出；<br>
  6. 完成严格类型检查、统一测试命令、CI 构建检查和文档更新。

## 当前架构

由于项目新增了行内解析器、HTML Renderer 和 Vue 编辑器，并清理了未接入的空壳模块，当前基础架构如下：

```text
lib/                         # Markdown 核心库
├── core/                    # 核心入口、状态和渲染器
│   ├── parser.ts            # 块级解析集成
│   ├── renderer/
│   │   └── htmlRender.ts    # 安全 HTML Renderer
│   ├── fsm/                 # 状态机
│   └── state.ts             # 解析上下文
├── parser/
│   ├── block/               # 块级解析
│   │   ├── rules/           # 段落、标题、列表、引用、表格等规则
│   │   └── state.ts         # 块级规则和解析器
│   └── inline/
│       └── index.ts         # 独立行内解析器
├── tokens/
│   └── token.ts             # 公共 Token 类型和结构
├── index.ts                 # 公共 API
└── cli.ts                   # 命令行调试入口
src/
├── App.vue                  # Vue 编辑器界面
├── main.ts                  # Vue 应用入口
└── style.css                # 编辑器样式
test/                        # Jest 测试
```
