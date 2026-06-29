# WeChat Mini Program References

This document collects the official WeChat Mini Program references that affect
One Day's product and architecture decisions.

## 1. Mini Program Development Framework

- Official docs: https://developers.weixin.qq.com/miniprogram/dev/framework/

Why it matters:

- One Day's primary China/private-domain entry should be a WeChat Mini Program
  client, not a web-first mobile page.
- The Mini Program should stay as a thin client: page rendering, user input,
  sharing, login handoff, payment/subscription-message entry points.
- Core business logic should stay in the backend so future clients can reuse it.

Architecture implication:

- Keep business rules out of Mini Program pages where possible.
- Use typed API contracts between the Mini Program and backend.
- Treat the Mini Program as the first production client, not the only product
  surface.

## 2. Network Ability and Server Domain Requirements

- Official docs: https://developers.weixin.qq.com/miniprogram/dev/framework/ability/network.html

Why it matters:

- Mini Program network requests must go through configured legal server domains.
- Production APIs must use HTTPS and be reachable through approved domains.
- The Mini Program client should not call third-party AI APIs directly.

Architecture implication:

- One Day needs a backend API domain from the beginning.
- AI calls should be made server-side through an internal AI gateway/service.
- Environment planning should include development, staging, and production API
  domains that can be configured in the WeChat platform.

## 3. Login Capability

- Official docs: https://developers.weixin.qq.com/miniprogram/dev/framework/open-ability/login.html

Why it matters:

- Mini Program login starts from `wx.login`.
- The client receives a temporary code and sends it to the backend.
- The backend exchanges that code for WeChat identity information and maps it to
  One Day's internal user account.

Architecture implication:

- Do not use `openid` as the whole user model.
- Keep an internal `User` table and store WeChat identity fields as auth
  provider data.
- Design authentication so future clients, such as web admin, app, or another
  login provider, can coexist with WeChat login.
