# One Day Demo Spec for Codex

## 0. Working Mode

Codex is the main developer. Claude Code / CC is the reviewer.

This is a 12-hour emergency demo. The goal is **not** to build a production app. The goal is to build a visually convincing, mobile-first, clickable demo that can be shown tomorrow to health / wellness industry partners.

Build for speed, clarity, and demo reliability.

---

## 1. Product Context

### Product Name

**One Day**

### Core Positioning

One Day is a 14-day “3+3 Life Order Rebuild” companion product.

It helps users complete:

- **3 internal actions**: restore body, emotion, rhythm.
- **3 external actions**: express, connect, create value.

### Demo Message

One Day is not a normal habit tracker. It is a daily life-order system:

> 14 days to bring a chaotic day back into rhythm:  
> 3 actions to repair yourself, 3 actions to move your life forward.

### What the demo must communicate in 5 seconds

1. This is a mobile-first product.
2. The core product is **daily 3+3**.
3. AI gives timely feedback.
4. The 14-day journey creates a visible report.
5. This can later become an App, but today it is a demo.

---

## 2. Demo Goal

Build a high-fidelity mobile web demo.

### Primary delivery

A local web app that can run in browser and look good on a phone screen.

### Recommended stack

Use:

- Vite
- React
- TypeScript
- Tailwind CSS

Do not add backend, auth, database, payment, or external APIs.

### Optional

If there is extra time, make the app look good in a desktop browser by centering a phone-sized frame.

---

## 3. Non-goals

Do **not** build the following:

- Real login / registration
- Real payment
- Real backend
- Real AI API call
- WeChat Mini Program
- Native iOS / Android app
- User account system
- Admin dashboard
- Medical scoring system
- Actual health diagnosis
- Push notification
- Social community
- Xiaohongshu / WeChat sharing automation

Use static mock data and page navigation only.

---

## 4. Core User Story

A user feels physically tired, emotionally scattered, and stuck in output.

She enters One Day, completes a quick intake, receives her daily 3+3 action card, checks in, receives AI feedback, and sees her 14-day progress and future report preview.

The demo path:

```text
Landing
→ Intake / Diagnosis
→ Today's 3+3 Action Card
→ Check-in
→ AI Feedback
→ 14-Day Progress
→ Final Report Preview
```

---

## 5. Required Pages

Create exactly these 7 pages or views.

Use client-side routing or simple state-based navigation. Either is fine.

### Page 1: Landing / Opening

Purpose: explain the product immediately.

Content:

- Product name: **One Day**
- Main headline: **14 天，把混乱的一天重新拉回秩序**
- Subtitle: **每天完成 3 件对内修复 + 3 件对外输出，让身体、状态和人生重新开始运转。**
- Three short value cards:
  - 修复身体
  - 稳定状态
  - 推进人生
- CTA button: **开始我的 One Day**

Suggested visual:
- Warm gradient background
- Large “Day 1 / 14” badge
- Minimal premium wellness style

---

### Page 2: Intake / Diagnosis

Purpose: show personalization.

Fields can be static UI inputs. No real submission needed.

Sections:

1. 当前最大困扰
   - 身体疲惫
   - 情绪内耗
   - 生活混乱
   - 输出停滞

2. 当前状态
   - 睡眠：不稳定
   - 精力：偏低
   - 情绪：容易焦虑
   - 输出：想做但拖延

3. 14 天后希望看到的变化
   - 更稳定的生活节律
   - 每天有明确行动
   - 开始对外表达
   - 看到阶段性成果

CTA: **生成我的 3+3 行动卡**

Click moves to Page 3.

---

### Page 3: Today's 3+3 Action Card

This is the core page.

Title:

**今日 3+3 行动卡**

Subtitle:

**今天不用改变一生，只需要把今天过回自己手里。**

Create two visually distinct cards.

#### Internal 3 Actions: 对内修复

1. **23:30 前入睡**  
   重建身体节律

2. **散步 20 分钟**  
   让身体重新流动

3. **睡前 5 分钟复盘**  
   记录今天的情绪和卡点

#### External 3 Actions: 对外输出

1. **发一条真实表达**  
   朋友圈 / 小红书 / 社群均可

2. **主动连接一个人**  
   问候、合作、感谢或重新建立联系

3. **推进一个作品或项目**  
   哪怕只完成一个最小步骤

CTA: **完成今日打卡**

Click moves to Page 4.

---

### Page 4: Check-in

Purpose: simulate user completion.

Title:

**今日打卡**

Sections:

#### 对内 3 件事

Use checkboxes:

- 23:30 前入睡
- 散步 20 分钟
- 睡前 5 分钟复盘

#### 对外 3 件事

Use checkboxes:

- 发一条真实表达
- 主动连接一个人
- 推进一个作品或项目

#### Text areas

- 今日最大的卡点
- 今日最想被反馈的一点

Default example text:

- 今日最大的卡点：晚上还是有点想刷手机，差点拖延。
- 今日最想被反馈的一点：我发了一条真实表达，但还是担心别人怎么看。

CTA: **获取 AI 及时反馈**

Click moves to Page 5.

---

### Page 5: AI Feedback

Purpose: show the AI value.

Title:

**One Day AI 及时反馈**

Show a warm AI feedback card.

Feedback copy:

> 你今天完成的不是简单打卡，而是重新把一天拉回自己的手里。  
>
> 对内部分，你已经开始关注睡眠和身体节律，这是恢复秩序的基础。  
>
> 对外部分，你完成了一次真实表达，这一步很关键。One Day 不只是让你变好，而是让你的变化被世界看见。  
>
> 明天建议你继续抓住两个动作：早点睡，以及完成一次真实表达。不要追求完美，先追求持续。

Below the feedback, show three AI tags:

- 已看见你的努力
- 明天继续一个小动作
- 对外输出已开始

CTA buttons:

- **查看 14 天进度**
- Secondary: **重新生成反馈**

Click primary moves to Page 6.

Note: “重新生成反馈” can simply change a small loading state or do nothing.

---

### Page 6: 14-Day Progress

Purpose: show the journey and data.

Title:

**14 天人生秩序重建进度**

Show:

- Day 1 / 14
- 连续打卡：1 天
- 对内完成率：67%
- 对外完成率：33%
- 当前状态：秩序重建中
- 距离结营复盘：13 天

Add progress bar and simple timeline:

- Day 1: 建立起点
- Day 3: 看见卡点
- Day 7: 初步稳定
- Day 14: 生成结营报告

CTA: **预览结营报告**

Click moves to Page 7.

---

### Page 7: Final Report Preview

Purpose: show future value and renewal hook.

Title:

**14 天后，你会获得一份 One Day 结营报告**

Sections:

1. 身体节律变化
   - 睡眠、精力、身体感受

2. 情绪状态变化
   - 内耗、焦虑、稳定度

3. 对外输出记录
   - 表达次数、连接次数、项目推进次数

4. 你的核心卡点
   - 哪些事情最容易中断

5. 下一阶段建议
   - 是否适合进入下一期 3+3 陪跑

Final CTA:

**预约 60 分钟咨询**

Secondary CTA:

**邀请朋友一起重建 One Day**

---

## 6. Navigation

Minimum requirement:

- All primary buttons navigate to the next page.
- Add a small top progress indicator such as `1 / 7`.
- Add a back button where possible.
- No router is required if state-based navigation is faster.

---

## 7. Visual Design

### Brand feeling

Premium, calm, warm, structured, female-friendly, health/wellness but not mystical.

### Avoid

- Medical look
- Hospital look
- Overly childish design
- Crypto / SaaS dashboard style
- Too much gamification
- Too many colors

### Suggested palette

Use Tailwind custom colors or CSS variables:

```css
--cream: #FAF6EF;
--warm-white: #FFFDF8;
--dawn-orange: #F59E5B;
--night-blue: #1F2A44;
--growth-green: #4C7A5D;
--soft-gold: #CFAE67;
--muted-text: #6B625A;
```

### Typography

Use system fonts. Chinese text must look clean.

Recommended CSS:

```css
font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", "Helvetica Neue", Arial, sans-serif;
```

### Layout

Mobile first:

- Width: 390px max for phone frame
- Background: full page warm cream
- Content card radius: 24px
- Buttons large enough for touch
- Use enough whitespace

Desktop:

- Center the phone frame
- Add background gradient
- Optional title outside frame: “One Day Demo”

---

## 8. Data

Use static mock data.

Create a file:

`src/data/demoData.ts`

Include:

- user name: 小禾
- current day: 1
- total days: 14
- internal tasks
- external tasks
- feedback text
- progress values
- final report sections

No API calls.

---

## 9. Components

Suggested components:

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

Do not overengineer. Use simple components.

---

## 10. Acceptance Criteria

The demo is acceptable if:

1. `npm install` works.
2. `npm run dev` works.
3. `npm run build` works.
4. The app looks like a mobile product.
5. All 7 pages can be visited in sequence.
6. No backend is required.
7. No external AI call is required.
8. Chinese copy is clean and readable.
9. The core 3+3 idea is obvious.
10. The AI feedback page feels like a product highlight.
11. The progress and report pages show why users may continue / renew.
12. It can be recorded into a 60-90 second demo video.

---

## 11. Implementation Plan for Codex

### Step 1: Create project

Create Vite React TypeScript app with Tailwind CSS.

### Step 2: Build static demo

Implement the 7-page flow using state-based navigation.

### Step 3: Add design system

Add global colors, typography, and card styles.

### Step 4: Add demo data

Create `demoData.ts` and feed the UI from static objects.

### Step 5: Polish mobile-first UX

Make it look good at 390px width.

### Step 6: Make desktop demo-friendly

Center the phone frame in desktop browser.

### Step 7: Build check

Run:

```bash
npm run build
```

Fix all errors.

---

## 12. Suggested File Structure

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
```

If time is limited, fewer files are acceptable. A single `App.tsx` with components is acceptable.

---

## 13. Copywriting Rules

Use Chinese UI text.

Tone:

- Warm but not emotional exaggeration
- Clear but not cold
- Action-oriented
- Avoid medical promise

Do not use:

- 治疗
- 治愈
- 疗效保证
- 改善疾病
- 诊断
- 医疗建议
- 必然改变

Allowed wording:

- 生活方式建议
- 行动陪伴
- 状态记录
- 节律重建
- 情绪支持
- 成长反馈

---

## 14. Demo Recording Script

After implementation, record a 60-90 second video with this flow:

1. Open Landing page.
2. Click “开始我的 One Day”.
3. Show intake briefly.
4. Generate 3+3 action card.
5. Check in.
6. Show AI feedback.
7. Show progress.
8. Show final report preview.

Voiceover / presenter script:

> One Day 不是一个普通打卡 App，而是一个 14 天人生秩序重建系统。  
> 用户每天完成 3 件对内修复和 3 件对外输出：对内修复身体、情绪和节律，对外完成表达、连接和价值推进。  
> 系统会根据用户的打卡内容给出即时反馈，并在 14 天后生成结营报告。  
> 现在我们先用轻量系统验证续费率、转介绍、完成率和满意度，验证成功后再产品化为正式 App。

---

# CC Reviewer Prompt

Use this prompt for Claude Code / CC after Codex finishes the first implementation.

```text
You are reviewing a 12-hour emergency demo for One Day.

Context:
One Day is a mobile-first 14-day 3+3 Life Order Rebuild demo. The goal is not production readiness. The goal is to make tomorrow's health/wellness industry meeting immediately understand the product.

Review priorities:
1. Does the first screen explain the product in 5 seconds?
2. Is the 3+3 model unmistakably clear?
3. Does the UI look like a premium mobile health / personal growth product?
4. Is the AI feedback page emotionally compelling but not medically risky?
5. Can the whole flow be recorded into a 60-90 second demo video?
6. Does npm run build pass?
7. Is there any unnecessary backend/auth/API overengineering?
8. Is the Chinese copy clean, concise, and credible?
9. Does the page work well at mobile width around 390px?
10. Are there obvious visual bugs, spacing issues, or broken buttons?

Do not request large rewrites unless critical. Focus on demo reliability, visual clarity, and removing anything that could break or confuse users.
```

---

## 15. Final Instruction to Codex

Build the demo now. Prioritize visible product quality over engineering completeness.

If time is short, implement all pages in `App.tsx` with static data and state-based navigation.

The final demo must be runnable locally and visually ready for screen recording.
