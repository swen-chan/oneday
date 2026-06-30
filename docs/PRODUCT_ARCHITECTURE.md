# One Day Product Architecture

This document records the current architecture decisions for the production
product line. The demo branch is treated as an archived prototype and is not the
base for production development.

## 1. Product Direction

One Day is a WeChat private-domain-first product for China users.

Primary acquisition path:

```text
WeChat groups / Official Account / private community
-> WeChat Mini Program
-> 7-day One Day cycle
-> check-in, AI feedback poster, final report, referral
```

Current decision:

- Build WeChat Mini Program first.
- Keep App development as a later-stage option.
- Keep `uni-app` as a backup option only. Reopen this decision if App delivery
  becomes a concrete 3-6 month requirement.
- Do not evolve production code directly from the demo branch.

## 2. Core Flow

The production flow should not copy the linear demo path.

Target user flow:

```text
Landing / WeChat login
-> Intake
-> generate and confirm 3+3 action plan
-> Home
-> Daily check-in
   -> show today's 3+3 actions
   -> collect completion and reflection
-> AI feedback poster
-> Home / progress
-> Day 7 check-in completed
-> final report poster generated immediately
```

Home should be a state-based product center, not a marketing page.

Initial Home entries:

- Today's check-in.
- 7-day progress.
- Latest AI feedback poster.
- Invite/share entry.
- Final report entry only after Day 7 is completed.

## 3. Client Architecture

Current decision:

- Primary client: WeChat native Mini Program + TypeScript.
- UI library: Decision pending between TDesign Weapp and Vant Weapp.
- Mini Program should stay as a thin client.

The Mini Program handles:

- Page rendering.
- User input.
- WeChat login handoff.
- WeChat sharing.
- Payment and subscription-message entry points.
- Poster display and sharing.

The Mini Program should not own:

- 7-day cycle business rules.
- AI prompt orchestration.
- Payment entitlement logic.
- CRM tagging logic.
- Report generation.

## 4. Backend Architecture

Current direction:

- Backend language: TypeScript.
- Backend framework: NestJS is preferred unless later constraints argue for a
  lighter Fastify-only service.
- API style: typed REST API first. GraphQL is not needed for MVP.
- Core business logic should live in backend modules.

Initial backend modules:

- Auth and WeChat identity.
- User profile.
- Intake.
- CRM tags.
- 7-day cycle engine.
- Daily action plan.
- Check-in.
- AI feedback.
- Poster generation.
- Final report.
- Referral/invite code.
- Event/notification abstraction.
- Admin API.
- Order/entitlement reservation.

## 5. Data and Deployment

Current decision:

- Database: PostgreSQL.
- ORM: Prisma.
- Early deployment can use one server with backend and PostgreSQL on the same
  machine.
- Do not start with a managed cloud database unless operational needs justify
  the cost and complexity.

This "single server first" choice is allowed only with clear backup and
migration discipline.

Minimum early deployment requirements:

- Docker Compose or equivalent repeatable deployment.
- PostgreSQL data volume outside application container.
- Automated logical backup, initially every 30 minutes.
- Backup files copied off-machine to object storage.
- Daily restore test in a non-production environment once real users exist.
- Environment variables and secrets kept out of Git.
- One-command migration path for Prisma migrations.

Backup direction:

- Start with scheduled `pg_dump` backups every 30 minutes.
- Add WAL archiving / point-in-time recovery when usage, payment, or operational
  risk grows.
- Keep generated poster assets in object storage, not inside the database.

Cloud direction:

- Tencent Cloud is preferred for WeChat ecosystem fit.
- Avoid Tencent-specific business logic in application code.
- Keep database, object storage, AI providers, and notification providers behind
  internal adapter interfaces so later migration to Alibaba Cloud or another
  provider remains practical.

## 6. AI Strategy

Current decision:

- Prefer domestic AI providers first.
- DeepSeek is the preferred first text/reasoning provider candidate.
- OpenAI can stay as a later fallback or comparison provider, not the default
  production assumption.
- AI calls must happen server-side.
- The backend should expose an internal AI gateway/provider abstraction.

AI responsibilities:

- Generate structured feedback content.
- Generate short social copy.
- Generate visual background prompts.
- Extract or suggest tags with confidence.
- Generate final report content.

AI should not directly control:

- Final poster layout.
- User privacy policy.
- Medical or psychological claims.
- Entitlement or business decisions.

## 7. AI Poster and Image Generation

Current decision:

- AI feedback is primarily a shareable poster, not a plain text paragraph.
- Final report should also generate a shareable poster.
- Poster rendering should happen server-side.
- AI image generation can be used for background素材.
- Text, invite code, QR code, logo, and layout should be rendered by our poster
  service, not left to the image model.

Poster pipeline:

```text
Check-in / report input
-> text model generates structured content
-> image model generates or selects background素材
-> safety and privacy filter
-> server-side poster renderer
-> upload to object storage
-> return poster URL to Mini Program
-> record share event when shared
```

This keeps typography, Chinese text, invite code, and Mini Program code stable
while still allowing AI-generated visual variety.

## 8. CRM and Tags

Current direction:

- Intake should collect enough structured information to support personalization
  and CRM.
- The first intake question set is not decided yet.
- Intake should not become too long or conversion will suffer.

Tag sources:

- Explicit user intake.
- Check-in behavior.
- AI inference with confidence.
- Admin/manual tagging.
- Referral and campaign source.

Core data principle:

- Store tags as structured records, not free-form strings only.
- Track tag source, confidence, cycle, and timestamp.
- Keep AI-inferred tags separate from user-confirmed facts.

## 9. Management and Operations

Current decision:

- Feishu is not part of the core product architecture.
- Feishu can be added later as an operations collaboration integration.
- The product should own its own admin API and future web admin.

MVP admin priority:

- Admin API first.
- Minimal web admin later.
- Feishu/WeCom notifications can subscribe to backend events later.

Useful events:

- `user.created`
- `cycle.started`
- `checkin.submitted`
- `ai.feedback.generated`
- `ai.feedback.failed`
- `poster.generated`
- `report.generated`
- `payment.succeeded`
- `share.created`

## 10. Decisions Still Pending

- Mini Program UI library: TDesign Weapp vs Vant Weapp.
- Exact backend framework: NestJS preferred, Fastify still possible.
- First deployment target: self-managed Tencent Cloud CVM vs another server.
- Object storage provider: Tencent COS preferred, but not finalized.
- First image generation provider: Alibaba Wanxiang, Tencent Hunyuan, Volcengine,
  or another domestic provider.
- Intake question set and first tag taxonomy.
- MVP payment strategy: free trial, invite code, one-time paid 7-day cycle, or
  delayed payment.
- First admin surface: API-only, minimal web admin, or delayed admin UI.
- Content and copy library rules.
- Compliance wording and forbidden-claim list.

## 11. Reference Links

- WeChat Mini Program framework:
  https://developers.weixin.qq.com/miniprogram/dev/framework/
- WeChat Mini Program network requirements:
  https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
- WeChat Mini Program login:
  https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- DeepSeek API docs:
  https://api-docs.deepseek.com/
- PostgreSQL backup and restore:
  https://www.postgresql.org/docs/current/backup.html
- PostgreSQL continuous archiving and PITR:
  https://www.postgresql.org/docs/current/continuous-archiving.html
- Alibaba Cloud Wanxiang text-to-image API:
  https://help.aliyun.com/zh/model-studio/text-to-image-v2-api-reference
- Tencent Cloud CVM docs:
  https://cloud.tencent.com/document/product/213
