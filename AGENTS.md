# Lumina GIF Studio - Agent 指令

欢迎来到 Lumina GIF Studio 仓库。这是一个专门为 AI 编码助手（如 Sisyphus）设计的指令文档，旨在确保代码库的质量、一致性和可维护性。

## 项目概览

Lumina GIF Studio 是一个基于浏览器的轻量级工具，允许用户上传视频、选择片段并将其转换为高质量的 GIF。

- **核心技术栈**:
  - **框架**: React 19 (完全使用函数式组件与 Hooks)。
  - **构建工具**: Vite 6 (极速热更新与现代构建流水线)。
  - **语言**: TypeScript (开启严格模式，确保类型安全)。
  - **样式**: Tailwind CSS v4 (采用最新的 `@import` 架构)。
  - **动画**: Framer Motion (通过 `motion/react` 包导入)。
  - **图标**: Lucide React。
  - **GIF 引擎**: `gifenc` (高性能 Web 端 GIF 编码器)。

## 目录结构

```text
src/
├── components/          # React UI 组件
│   ├── GifPreview.tsx   # GIF 生成后的预览与下载
│   ├── VideoEditor.tsx  # 核心编辑界面（预览、进度条、参数设置）
│   └── VideoUploader.tsx # 视频上传占位与逻辑
├── lib/                 # 核心逻辑与工具函数
│   ├── gifGenerator.ts  # GIF 编码核心实现（Canvas API + gifenc）
│   └── utils.ts         # 辅助函数（如 cn 工具）
├── App.tsx              # 应用根组件，管理全局状态（视频流、进度、结果）
├── main.tsx             # 应用入口点
└── index.css            # 全局样式与 Tailwind 导入
```

## 常用开发命令

| 任务 | 命令 | 说明 |
|------|---------|------|
| 启动开发服务器 | `npm run dev` | 默认运行在 `http://localhost:3000` |
| 生产环境构建 | `npm run build` | 产物输出至 `dist/` |
| 类型检查 | `npm run lint` | 运行 `tsc --noEmit` 验证 TS 类型 |
| 预览构建版本 | `npm run preview` | 本地启动生产环境产物预览 |
| 清理环境 | `npm run clean` | 删除 `dist/` 目录 |

### 测试说明
目前项目中尚未集成自动化测试。在开发复杂的 `src/lib/` 逻辑时，建议优先编写健壮的类型定义。

---

## 代码风格与规范

### 1. 命名约定
- **文件**:
  - React 组件: `PascalCase.tsx` (如 `VideoEditor.tsx`)。
  - 逻辑/工具: `camelCase.ts` (如 `gifGenerator.ts`)。
- **变量与函数**: 一律使用 `camelCase`。
- **类型与接口**: 使用 `PascalCase`。**不要**加 `I` 或 `T` 前缀。
- **常量**: 全局常量使用 `SCREAMING_SNAKE_CASE`。

### 2. 导入与导出规范
- **导出**: 优先使用 **具名导出 (Named Exports)**。这有助于 IDE 重构和 tree-shaking。
- **例外**: `App.tsx` 作为根组件使用 `export default`。
- **排序顺序**:
  1. React 核心 (React, { useState } 等)。
  2. 外部第三方库 (`motion`, `lucide`, `gifenc`)。
  3. 本地组件 (`@/components/...`)。
  4. 内部逻辑与工具 (`@/lib/...`)。
  5. 类型定义与样式。

### 3. TypeScript 最佳实践
- **严禁使用 `any`**: 必须为所有数据结构定义准确的 `type` 或 `interface`。
- **函数返回类型**: `src/lib/` 下的函数应显式声明返回类型。
- **状态初始化**: 对于可能为 null 的状态，必须显式定义泛型类型：
  `const [file, setFile] = useState<File | null>(null);`
- **Ref 类型**: 明确指定 Ref 绑定的 DOM 类型：
  `const videoRef = useRef<HTMLVideoElement>(null);`

### 4. 组件开发模式
- **函数式组件**: 仅使用函数组件，避免 Class 组件。
- **状态提升**: 全局状态（如当前视频文件）应保留在 `App.tsx` 中。
- **解构 Props**: 在函数参数中直接解构 Props 并定义接口。
- **样式合并**: 使用 `cn(...)` 工具合并 Tailwind 类名。

### 5. UI 与视觉语言
- **设计风格**: "Atmospheric Dark" (氛围感暗黑模式)。
  - 背景色: `#050505`。
  - 边框与强调: 白色透明度 (如 `white/10`, `white/20`)。
  - 字间距: `tracking-tight`。
- **交互**: 
  - 所有按钮和卡片应有平滑的过度。
  - 使用 `AnimatePresence` 处理组件的挂载与卸载动画。

---

## 技术实现细节

### 内存管理
- **对象 URL**: 必须在 `useEffect` 的清理函数中调用 `URL.revokeObjectURL(url)`。这是防止浏览器标签页内存溢出的关键。

### GIF 编码流水线
- 编码逻辑位于 `src/lib/gifGenerator.ts`。
- **性能关键点**: 
  - 提取帧时使用 `ctx.getImageData`。
  - 使用 `await new Promise(r => setTimeout(r, 0))` 让出主线程，确保用户界面的进度条能够实时更新且不阻塞浏览器。
  - 默认限制: 处理长视频时会弹出确认框，防止过度消耗客户端资源。

## Agent 操作准则

1. **先检查再修改**: 修改前务必先阅读相关文件及其依赖关系。
2. **遵守 CSS 规范**: 不要随意引入外部 CSS 文件，尽量通过 Tailwind 类名实现所有布局。
3. **验证类型**: 修改任何 Props 或接口后，必须运行 `npm run lint`。
4. **提交信息**: 遵循清晰的提交规范 (如 `feat: add resolution settings`, `fix: memory leak in video preview`)。
5. **响应式适配**: 所有新 UI 必须兼容移动端 (使用 Tailwind 的 `md:` 或 `lg:` 断点)。

---
*上次更新: 2026-03-03*
