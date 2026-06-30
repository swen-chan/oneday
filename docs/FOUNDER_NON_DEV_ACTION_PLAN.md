# Founder Non-Development Action Plan

This document lists the non-development work that should move in parallel with
One Day's engineering work. The goal is to avoid finishing development but being
blocked by account,备案, domain, payment, AI provider, or compliance work.

## 1. Confirm Launch Entity

Priority: immediate.

Owner tasks:

- Confirm the company主体 used for launch.
- Prepare business license.
- Prepare legal representative information.
- Choose the Mini Program administrator's WeChat account, phone number, and
  email.
- Confirm the bank account and invoice/collection entity.

Recommendation:

- Use a company主体, not a personal主体.
- Keep the Mini Program, domain备案, server, WeChat Pay, and contracts under the
  same主体 when possible.

## 2. Register WeChat Ecosystem Accounts

Priority: immediate.

Owner tasks:

- Register or confirm the WeChat Mini Program account.
- Confirm whether an Official Account / 服务号 already exists.
- Align the Mini Program and Official Account主体 if possible.
- Prepare Mini Program name, avatar, introduction, and service category.
- Start WeChat verification.
- If charging users in MVP or shortly after, prepare WeChat Pay merchant account
  materials.

Service category caution:

- Do not position One Day as medical diagnosis, psychotherapy, treatment, or
  guaranteed healing.
- Prefer growth, productivity, habit, check-in, self-management, content service,
  or companion-style positioning, depending on currently available WeChat
  categories.

## 3. Domain Strategy

Priority: immediate.

You do not need to buy multiple domains for `api`, `admin`, and `assets`.

Usually, buy one root domain:

```text
example.com
```

Then create subdomains through DNS:

```text
api.example.com
admin.example.com
assets.example.com
www.example.com
```

Subdomains are DNS records under the same purchased root domain. They are not
separate domain purchases.

Minimum practical setup for MVP:

- Required: one root domain.
- Required for Mini Program backend: one HTTPS API domain, such as
  `api.example.com`.
- Optional at first: `admin.example.com`, if the admin panel is not public yet.
- Optional at first: `assets.example.com`, if poster assets temporarily use an
  object-storage/CDN domain that can pass WeChat configuration.
- Optional at first: `www.example.com`, unless a public website or landing page
  is needed.

Recommended production setup:

```text
api.example.com      backend API
admin.example.com    management/admin panel
assets.example.com   poster images and static assets
www.example.com      public website, later if needed
```

Important:

- WeChat Mini Program network requests require configured legal server domains.
- Production domains should use HTTPS.
- Domains hosted on mainland China infrastructure usually need ICP备案.
- Avoid using bare IP addresses in production.

## 4. Server and备案 Path

Priority: immediate, because备案 can block launch.

Recommended early path:

```text
Buy root domain
-> complete domain real-name verification
-> buy one mainland server, Tencent Cloud CVM preferred
-> perform ICP备案 through the cloud provider
-> perform Mini Program备案 in WeChat public platform
-> if there is a public website/admin entry, prepare 公安联网备案 as needed
-> configure legal server domains in WeChat Mini Program backend
```

Early deployment decision:

- It is acceptable to start with one server that runs backend + PostgreSQL.
- This is not a reason to skip backup, restore testing, or migration planning.

Minimum operational requirements:

- 30-minute PostgreSQL logical backups.
- Backups copied off-machine, preferably to object storage.
- Restore test before real users or payment.
- Environment variables and secrets kept out of Git.

## 5. Compliance Documents

Priority: start early, finish before external test.

Owner tasks:

- User agreement.
- Privacy policy.
- Personal information collection list.
- Third-party data sharing list.
- AI-generated content explanation.
- Account cancellation / data deletion process.
- Customer service and complaint contact.
- Refund and service rules if payment is introduced.

Content boundary:

- One Day should not claim diagnosis, treatment, therapy, guaranteed improvement,
  disease intervention, or medical advice.
- Intake and check-in copy should be reviewed for emotional/psychological risk
  wording.
- AI-generated posters should pass privacy and safety checks before sharing.

## 6. AI Provider Accounts

Priority: start soon.

Owner tasks:

- Register DeepSeek API account for text/reasoning.
- Select at least one domestic image generation provider candidate.
- Prepare content moderation/safety provider.
- Prepare object storage account for generated posters.

Current direction:

- Text/reasoning: DeepSeek first.
- Image background素材: domestic image generation provider, decision pending.
- Poster rendering: server-side rendering controlled by One Day.
- AI should not directly render final Chinese text, invite code, QR code, or
  brand layout into the image model output.

Open decisions:

- First image generation provider.
- Whether an additional fallback text model is needed.
- Whether the product form triggers additional generative AI compliance review;
  confirm with legal/compliance advice before public launch.

## 7. Payment and Entitlement

Priority: decide before MVP scope freezes.

Owner tasks:

- Decide whether MVP is free, invite-code-only, paid, or campaign-code-based.
- If paid, decide price, refund rule, and service duration.
- Prepare WeChat Pay merchant account.
- Confirm whether the first 7-day cycle is a one-time product, trial, or
  repeatable product.

Development impact:

- Payment choice affects `Order`, `Entitlement`, refund, customer service, and
  access-control logic.
- If payment is delayed, the backend should still reserve order/entitlement
  models.

## 8. Intake and CRM Tag Taxonomy

Priority: daily push item until decided.

Owner tasks:

- Push partners every day on the first intake question set.
- Push partners every day on the CRM tag taxonomy.
- Decide which questions are required and which are optional.
- Decide which answers generate tags.
- Decide which tags are user-confirmed, AI-inferred, behavioral, or admin-set.

Initial tag buckets:

- User state.
- Action preference.
- Source channel.
- Campaign/referral source.
- Commercial potential.
- Retention/repurchase signal.
- Share/referral potential.

Important:

- Intake should support personalization and CRM.
- Intake should not become so long that users drop before starting the 7-day
  cycle.

## 9. Brand, Copy, and Sharing Materials

Priority: start before poster development.

Owner tasks:

- Collect high-quality poster style references.
- Prepare brand tone examples.
- Prepare forbidden words and forbidden sentence patterns.
- Prepare WeChat group sharing copy.
- Prepare Moments sharing copy.
- Prepare Official Account handoff copy.
- Prepare invite-code rules.
- Prepare seed user list.
- Prepare customer service reply templates.

Sharing caution:

- Avoid forced or manipulative sharing mechanics.
- Do not make core progress depend on aggressive sharing behavior.
- Prefer natural sharing: completion poster, daily feedback poster, invite code,
  and friend-starting-together scenarios.

## 10. Information Needed by Development

Provide these once available:

- Mini Program AppID.
- Selected Mini Program service category.
- Domain name and planned subdomains.
- ICP备案 progress.
- Server provider and region.
- Whether MVP includes WeChat Pay.
- DeepSeek account readiness.
- Image generation provider choice.
- Object storage provider choice.
- First intake question draft.
- First CRM tag taxonomy draft.

Do not paste secrets into chat:

- Mini Program AppSecret.
- API keys.
- Database password.
- Cloud secret keys.
- WeChat Pay private keys.

These should be handled through environment variables or a secrets manager.

## 11. Reference Links

- WeChat Mini Program framework:
  https://developers.weixin.qq.com/miniprogram/dev/framework/
- WeChat Mini Program network requirements:
  https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html
- WeChat Mini Program login:
  https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html
- MIIT ICP filing system:
  https://beian.miit.gov.cn/
- Public security filing portal:
  https://www.beian.gov.cn/
- Generative AI service regulation:
  https://www.cac.gov.cn/2023-07/13/c_1690898327029107.htm
- DeepSeek API docs:
  https://api-docs.deepseek.com/
