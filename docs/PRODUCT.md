# Ahead: product and business direction

## The job

Help a small operations team turn a sales export into an evidence-backed starting point for its next stock or staffing review. The primary audience is an ecommerce operator or analyst who already works in spreadsheets, has one regularly measured metric, and wants a forecast they can explain.

**Promise:** upload a CSV, choose relevant history, forecast, test against past data, export a brief. Do not promise automatic purchasing decisions or a universal accuracy level. Stockouts hide true demand; promotions and supply constraints require human context.

Ahead is a working name, not a claim of trademark or domain availability. Confirm both before launch.

## What ships

- Public product story, operations use case, two practical guides, methodology, pricing and privacy pages.
- Working single-series workspace with data preview, date window, forecast and range, chronological one/three-window validation, CSV and Markdown brief export.
- Independent statistical engine by default. Optional TimesFM research mode remains isolated; no restricted weights are bundled.
- No accounts, billing, email collection, tracking, advertising or saved datasets. Buttons only perform available actions.

## Revenue hypothesis

The reusable forecasting workflow is the product; an ad-supported chart alone is unlikely to justify inference and acquisition costs. Validate willingness to pay before adding billing.

| Offer | Customer value | Status |
| --- | --- | --- |
| Core | Explore one metric, validate and export | Free beta, implemented |
| Team | Saved projects, scheduled refreshes, multi-product runs, shared reports | Planned; test £19–49/team/month as a hypothesis, not advertised pricing |
| Managed deployment | Private hosting, support and agreed retention | Future service; scope with early customers |
| Editorial sponsorship/ads | Support useful preparation and forecasting guides | Future only; outside the data workspace |

Use paid limits tied to recurring workloads and compute cost, not arbitrary restrictions on understanding a result. Server-side account entitlements, metering, billing webhooks and cancellation must exist before a paid plan goes live. None is simulated here.

## Acquisition and measurement

Start with the specific query/problem “forecast weekly orders from CSV”. The public guides answer real setup and interpretation questions. Each leads to a relevant example in the workspace. Avoid generating thin pages for thousands of keywords.

Manually recruit five operators for a short usability session. Record whether they upload valid data, complete a backtest, export a brief, and return with new actuals. Ask which planning decision changed. Proposed activation: first forecast plus a backtest and an export; proposed retention: a second dataset refresh within four weeks. These are measurement definitions, not installed analytics or achieved outcomes.

Track unit economics before expanding: cost per forecast/backtest, support time per activated team, repeat use, paid conversion and monthly gross margin. The independent CPU engine keeps early inference cost low; usage abuse still needs public-host protection.

## Advertising boundary

Google Ads is generally for buying acquisition; AdSense is for earning from publisher placements. Neither is connected. For future publisher ads, reserve a labeled placement after substantive guide content, never inside upload forms, forecast controls, charts or error messages. No empty ad placeholders are shown today. Add the real publisher configuration, network approval, required disclosures and applicable consent controls at that stage. Never send uploaded values or filenames to an ad or analytics network. Ads must not be necessary to complete a forecast.

## Launch gates

Choose domain and operator identity; set SITE_URL and configure HTTPS. Publish deployment-specific privacy contact, hosting region and retention details. Add upstream request-body limits and abuse protection; the current two-job semaphore is per process and is not a distributed rate limiter. Configure logs without uploaded data, monitoring and dependency updates. Validate model behavior on actual customer data. Keep TimesFM 3 out of commercial operation unless separately licensed.

Accounts, billing and scheduled jobs are deliberate next releases. A public domain, paid service or AdSense approval is not part of this local delivery.

## Research used

- [TimesFM 3 license](https://huggingface.co/google/timesfm-3.0-pytorch/blob/main/LICENSE): commercial and production restriction drove the independent default engine.
- [Google JavaScript SEO](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics): public HTML is prerendered, links use real URLs, and metadata is page-specific.
- [Google helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content): specific operational guides instead of keyword filler.
- [Anthropic multi-agent engineering](https://www.anthropic.com/engineering/multi-agent-research-system): agents add token overhead. This build used two narrowly scoped agents with fresh context and short handoffs, not a broad agent swarm. No claim of measured token savings.

- [Google Ads versus AdSense](https://support.google.com/adsense/answer/76231): advertiser spending and publisher revenue are different products; neither is connected here.
