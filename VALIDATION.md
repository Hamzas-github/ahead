# Release checks — 21 October 2026

- 42 backend tests pass on Python 3.12, including metric calculations, date bounds, missing-data handling, leakage protection, overflow regressions and the TimesFM production guard.
- Strict TypeScript, Vite client build and public-page prerender all pass. Eight public pages have HTML content before JavaScript runs.
- Tested the built site with the independent statistical engine and the synthetic 156-week store example. A 12-week prediction and three past-data checks completed through the browser.
- Date input changes update the selected count. A 12-point selection disables prediction and explains that at least 30 are needed. Help buttons show short optional explanations.
- Desktop 1440 × 900 and mobile 375 × 812 checked. Mobile document width is 365px: no horizontal page overflow. Controls collapse above the chart.
- Browser console showed no JavaScript errors. Downloaded CSV and planning brief verified on disk: 12 forecast rows with bounds, plus the expected summary and three-window check results.
- Source review found no apparent credentials, private user paths, model weights or customer data in the intended repository contents. Sample orders are synthetic.
- This is a local product beta, not a hosted SaaS or a validated accuracy claim. Billing, ads and tracking are not installed. Public indexing requires a real SITE_URL at build time. TimesFM 3 remains research-only and is blocked when APP_ENV=production.

