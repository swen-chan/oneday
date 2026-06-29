# One Day Demo 开发协作计划

本文档用于协调 One Day Demo 的主开发与 Reviewer 协作。

当前依据文件：

- `ONEDAY_DEMO_SPEC_FOR_CODEX.md`

开发目标不是生产级产品，而是在 12 小时内完成一个移动端优先、视觉可信、可录屏展示的 7 页点击式 demo。

---

## 1. 协作角色

### Codex：主开发

负责：

- 创建项目与基础工程。
- 按 TDD 流程编写测试。
- 实现页面、组件、数据与交互。
- 运行本地验证命令。
- 根据 CC review 反馈修正代码。
- 保证最终 demo 可本地运行、可构建、可录屏。

### CC：Reviewer / 辩证性开发协作者

负责：

- 审核需求理解是否准确。
- 审核 demo 是否能在 5 秒内传达核心价值。
- 审核 3+3 模型是否清晰。
- 审核视觉是否符合高端、温暖、健康 / 成长产品气质。
- 审核中文文案是否可信、克制，且没有医疗风险表达。
- 审核是否有过度工程化。
- 提出 Blocker / Should Fix / Can Defer 级别反馈。

CC 不直接修改文件代码。

---

## 2. 基本开发原则

### Demo 优先级

优先保证：

1. 7 页完整路径可点击。
2. 移动端 390px 宽度下视觉可靠。
3. One Day 的 14 天 3+3 逻辑一眼可懂。
4. AI 反馈页有产品亮点。
5. 进度页与报告页能体现续费 / 咨询 / 转介绍价值。
6. `npm run build` 通过。

暂不追求：

- 真实后端。
- 真实登录。
- 真实 AI API。
- 数据库。
- 支付。
- 用户账户系统。
- 管理后台。
- 医疗评分或诊断能力。

### 模块级提交与审核

由于时间紧张，主开发与审核都以模块为单位推进。

一个模块对应一次主开发提交和一次 CC review。不要把模块内的每个小测试都拆成独立审核点，避免审核流程过碎。

建议 commit 粒度：

```text
module-01-foundation
module-02-demo-data
module-03-app-shell-navigation
module-04-design-system
module-05-landing
module-06-intake
module-07-action-card
module-08-checkin
module-09-ai-feedback
module-10-progress
module-11-report-preview
module-12-e2e-demo-flow
```

每个模块 commit 应包含：

- 当前模块的实现代码。
- 当前模块必要测试。
- 为通过当前模块测试所需的最小相关调整。
- 简短 commit message，说明模块目标和验证结果。

### 模块内 Goal-driven TDD 节奏

模块内部仍遵循 TDD，但以模块目标为驱动，不追求机械地为每个细小 UI 文案单独走 review。

每个模块内部建议流程：

1. Codex 先写失败测试。
2. Codex 围绕模块目标实现最小完整功能。
3. Codex 在模块内持续补充必要测试，直到模块目标被覆盖。
4. Codex 运行当前模块相关测试。
5. Codex 运行全量基础验证，至少包括 `npm run test`，关键节点运行 `npm run build`。
6. Codex 提交一个模块级 commit。
7. CC 对该模块 commit 进行 review。
8. Codex 根据 CC 反馈在同一模块内追加修正 commit，或在进入下一模块前 squash / 整理。
9. 当前模块达标后进入下一模块。

模块内测试的原则：

- 测试服务于模块目标，而不是追求数量。
- 优先覆盖页面路径、核心文案、关键交互、数据约束和 demo 稳定性。
- 对纯视觉细节，优先使用移动端截图 / Playwright smoke test 辅助判断。
- 不为低风险样式细节写过多单测。

---

## 3. 推荐项目结构

```text
oneday-demo/
  package.json
  index.html
  src/
    main.tsx
    App.tsx
    index.css
    data/
      demoData.ts
    components/
      PhoneFrame.tsx
      ProgressHeader.tsx
      Button.tsx
      Cards.tsx
      Timeline.tsx
    pages/
      Landing.tsx
      Intake.tsx
      ActionCardPage.tsx
      Checkin.tsx
      Feedback.tsx
      Progress.tsx
      ReportPreview.tsx
    test/
      setup.ts
  e2e/
    demo-flow.spec.ts
```

如果时间紧张，可以先减少组件文件，但仍建议保留：

- `src/data/demoData.ts`
- `src/App.tsx`
- `src/pages/*`
- `src/components/*`

---

## 4. 模块拆分

### Module 1：基础工程

目标：

- 创建 Vite + React + TypeScript 项目。
- 接入 Tailwind CSS。
- 接入 Vitest + Testing Library。
- 预留 Playwright E2E 测试。

测试：

- `App` 能正常 render。
- 页面中能看到 `One Day`。
- `npm run build` 可运行。

验收命令：

```bash
npm run test
npm run build
```

CC review 重点：

- 是否符合 demo 速度目标。
- 是否没有引入 backend / auth / API 等过度工程。

---

### Module 2：静态数据

目标：

- 创建 `src/data/demoData.ts`。
- 所有页面核心文案和 mock 数据从该文件读取。

数据必须包含：

- user name：`小禾`
- current day：`1`
- total days：`14`
- internal tasks：3 条
- external tasks：3 条
- AI feedback 文案
- progress values
- final report sections

测试：

- 对内任务数量必须为 3。
- 对外任务数量必须为 3。
- `currentDay` 为 1。
- `totalDays` 为 14。
- 禁止出现医疗风险词：`治疗`、`治愈`、`疗效保证`、`改善疾病`、`诊断`、`医疗建议`、`必然改变`。

CC review 重点：

- 3+3 模型是否清楚。
- 数据是否支撑 14 天陪跑感。
- 文案是否克制可信。

---

### Module 3：App Shell 与导航

目标：

- 使用 state-based navigation 实现 7 页路径。
- 添加顶部进度：`1 / 7` 到 `7 / 7`。
- 添加返回按钮，第一页除外。

固定路径：

```text
Landing
→ Intake / Diagnosis
→ Today's 3+3 Action Card
→ Check-in
→ AI Feedback
→ 14-Day Progress
→ Final Report Preview
```

测试：

- 初始页面是 Landing。
- 点击每个主 CTA 可进入下一页。
- 7 页标题按顺序出现。
- 返回按钮可返回上一页。
- 顶部进度数字正确。

CC review 重点：

- 录屏路径是否顺滑。
- 是否有断点、死路或按钮无响应。

---

### Module 4：设计系统组件

目标：

- 建立统一移动端视觉结构。
- 桌面端居中显示 phone frame。

组件：

- `PhoneFrame`
- `ProgressHeader`
- `PrimaryButton`
- `SecondaryButton`
- `ActionCard`
- `TaskCheckbox`
- `MetricCard`
- `Timeline`
- `FeedbackCard`
- `ReportSection`

测试：

- `ProgressHeader` 显示当前页和总页数。
- `PrimaryButton` 能响应点击。
- `SecondaryButton` 能响应点击。
- 卡片组件能渲染标题和内容。

视觉约束：

- mobile first。
- phone frame 最大宽度约 390px。
- warm cream 背景。
- 大按钮适合触控。
- 字体使用系统中文字体。

CC review 重点：

- 是否像一个高保真移动产品。
- 是否避免医院感、幼稚感、SaaS dashboard 感。
- 中文在移动端是否可读。

---

### Module 5：Landing / Opening

目标：

- 5 秒内说明产品是什么。

必须展示：

- `One Day`
- `14 天，把混乱的一天重新拉回秩序`
- `每天完成 3 件对内修复 + 3 件对外输出，让身体、状态和人生重新开始运转。`
- 价值卡：`修复身体`、`稳定状态`、`推进人生`
- CTA：`开始我的 One Day`
- `Day 1 / 14` 视觉提示

测试：

- 上述所有关键文案出现。
- 点击 CTA 进入 Intake。

CC review 重点：

- 第一屏是否能立即传达 14 天 3+3。
- 是否有 premium wellness 气质。

---

### Module 6：Intake / Diagnosis

目标：

- 展示轻量个性化输入。
- 避免真实医疗诊断感。

必须展示：

- 当前最大困扰。
- 当前状态。
- 14 天后希望看到的变化。
- CTA：`生成我的 3+3 行动卡`

测试：

- 四个困扰选项出现。
- 四个当前状态出现。
- 四个目标变化出现。
- 点击 CTA 进入行动卡页。

CC review 重点：

- 是否有个性化感。
- 是否没有医疗诊断暗示。

---

### Module 7：Today's 3+3 Action Card

目标：

- 明确展示核心产品：每日 3+3。

必须展示：

- 标题：`今日 3+3 行动卡`
- 副标题：`今天不用改变一生，只需要把今天过回自己手里。`
- 对内修复 3 条：
  - `23:30 前入睡`
  - `散步 20 分钟`
  - `睡前 5 分钟复盘`
- 对外输出 3 条：
  - `发一条真实表达`
  - `主动连接一个人`
  - `推进一个作品或项目`
- CTA：`完成今日打卡`

测试：

- 对内任务数量为 3。
- 对外任务数量为 3。
- 6 条任务全部展示。
- 点击 CTA 进入 Check-in。

CC review 重点：

- 3+3 是否一眼清晰。
- 对内 / 对外是否视觉上有区分。

---

### Module 8：Check-in

目标：

- 模拟用户完成今日打卡。

必须展示：

- 对内 3 个 checkbox。
- 对外 3 个 checkbox。
- 两个文本区域：
  - 今日最大的卡点。
  - 今日最想被反馈的一点。
- 默认示例文本。
- CTA：`获取 AI 及时反馈`

测试：

- 6 个 checkbox 可点击。
- 两个 textarea 存在并有默认值。
- 点击 CTA 进入 AI Feedback。

CC review 重点：

- 是否像真实打卡流程。
- 默认文案是否自然。

---

### Module 9：AI Feedback

目标：

- 展示 demo 的核心 AI 价值。

必须展示：

- 标题：`One Day AI 及时反馈`
- spec 中的温暖反馈文案。
- 三个 AI tag：
  - `已看见你的努力`
  - `明天继续一个小动作`
  - `对外输出已开始`
- 主 CTA：`查看 14 天进度`
- 次 CTA：`重新生成反馈`

测试：

- 反馈正文出现。
- 3 个 tag 出现。
- 点击主 CTA 进入 Progress。
- 点击重新生成反馈不会破坏页面，可出现短 loading 或状态变化。

CC review 重点：

- 是否有情绪支持和产品亮点。
- 是否没有医疗承诺。
- 是否足够适合会议展示。

---

### Module 10：14-Day Progress

目标：

- 展示旅程感和数据反馈。

必须展示：

- `Day 1 / 14`
- `连续打卡：1 天`
- `对内完成率：67%`
- `对外完成率：33%`
- `当前状态：秩序重建中`
- `距离结营复盘：13 天`
- progress bar
- timeline：
  - Day 1：建立起点
  - Day 3：看见卡点
  - Day 7：初步稳定
  - Day 14：生成结营报告
- CTA：`预览结营报告`

测试：

- 所有指标出现。
- 四个 timeline 节点出现。
- 点击 CTA 进入 Report Preview。

CC review 重点：

- 是否让用户理解 14 天不是普通打卡。
- 是否体现持续陪跑价值。

---

### Module 11：Final Report Preview

目标：

- 展示 14 天后的结果感和下一阶段转化。

必须展示：

- 标题：`14 天后，你会获得一份 One Day 结营报告`
- 报告 section：
  - 身体节律变化
  - 情绪状态变化
  - 对外输出记录
  - 你的核心卡点
  - 下一阶段建议
- Final CTA：`预约 60 分钟咨询`
- Secondary CTA：`邀请朋友一起重建 One Day`

测试：

- 5 个报告 section 出现。
- 两个 CTA 出现。
- 页面在最终状态不会跳错。

CC review 重点：

- 是否形成自然的咨询 / 续费 / 转介绍 hook。
- 是否没有夸大承诺。

---

### Module 12：E2E 录屏路径验证

目标：

- 确保整个 demo 可在手机宽度下顺利录屏。

Playwright 测试：

- viewport：`390x844`。
- 从 Landing 开始。
- 逐页点击主 CTA。
- 最终到达 Report Preview。
- 每页核心标题存在。

验收命令：

```bash
npm run test:e2e
```

CC review 重点：

- 是否适合录制 60-90 秒 demo。
- 是否有明显 spacing、遮挡、按钮过小、文本溢出问题。

---

## 5. 测试清单

推荐测试文件：

```text
src/data/demoData.test.ts
src/components/ProgressHeader.test.tsx
src/components/Button.test.tsx
src/pages/Landing.test.tsx
src/pages/Intake.test.tsx
src/pages/ActionCardPage.test.tsx
src/pages/Checkin.test.tsx
src/pages/Feedback.test.tsx
src/pages/Progress.test.tsx
src/pages/ReportPreview.test.tsx
src/App.flow.test.tsx
e2e/demo-flow.spec.ts
```

最低必须覆盖：

- 7 页都能被访问。
- 主 CTA 顺序正确。
- 顶部进度正确。
- 3+3 任务数量正确。
- 禁止医疗风险词。
- AI feedback 页面内容完整。
- Progress 和 Report 能体现 14 天价值。
- 移动端 E2E 路径通过。

---

## 6. CC Review 模板

Codex 每轮提交给 CC 时，应以模块级 commit 为单位提供信息：

```text
当前模块：

Commit：

模块目标：

实现范围：

已通过测试：

验证命令：

移动端截图 / 观察：

已知 tradeoff：

需要 CC 重点看的问题：
```

CC review 时只需要审核当前模块 commit 的完整性和 demo 风险，不需要逐个小测试进行单独审核。

CC 反馈建议使用以下格式：

```text
Blocker:
- ...

Should Fix:
- ...

Can Defer:
- ...

Overall:
- ...
```

定义：

- Blocker：不修会影响明天 demo。
- Should Fix：建议本轮修复，成本可控，收益明显。
- Can Defer：不影响当前 demo，可后置。

---

## 7. 总体验收标准

最终 demo 完成时必须满足：

- `npm install` works。
- `npm run dev` works。
- `npm run build` works。
- `npm run test` works。
- `npm run test:e2e` works，或明确说明未执行原因。
- 所有 7 页可按顺序访问。
- 没有 backend、auth、database、payment、external API。
- 中文文案干净、克制、可读。
- 核心 3+3 概念明显。
- AI 反馈页是产品亮点。
- 进度页和报告页体现继续参与的价值。
- 移动端 390px 视觉可靠。
- 可录制 60-90 秒 demo 视频。

---

## 8. 最终交付说明模板

Codex 完成开发后，最终回复应包含：

```text
已完成：
- ...

验证：
- npm run test
- npm run build
- npm run test:e2e

本地运行：
- 项目目录：...
- 启动命令：npm run dev
- 本地 URL：...

需要 CC 最后 review：
- 5 秒产品理解
- 3+3 清晰度
- 移动端视觉
- AI 反馈页
- 60-90 秒录屏路径
```
