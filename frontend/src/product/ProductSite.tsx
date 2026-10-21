import type { ReactNode } from "react";
import "./product.css";

export const routes = [
  {
    path: "/",
    title: "Ahead — See what could happen next",
    description:
      "Upload past sales or orders. Get an estimate of what comes next, then check it against numbers you already know. Free to try, with no account.",
  },
  {
    path: "/use-cases/demand-planning",
    title: "Plan stock and staffing | Ahead",
    description:
      "Use past sales or orders to estimate how much stock or staff you may need. Check the estimate before making a plan.",
  },
  {
    path: "/guides",
    title: "Forecasting guides | Ahead",
    description:
      "Two short guides to getting your spreadsheet ready and understanding your forecast.",
  },
  {
    path: "/guides/prepare-your-csv",
    title: "Prepare your CSV for forecasting | Ahead",
    description:
      "Save your spreadsheet as a CSV with one date and one number per row. Learn how to check totals and fill gaps.",
  },
  {
    path: "/guides/read-a-forecast",
    title: "How to read a forecast | Ahead",
    description:
      "Learn what the forecast line and shaded range mean, and how to check an estimate against past results.",
  },
  {
    path: "/pricing",
    title: "Pricing — Free public beta | Ahead",
    description:
      "Try Ahead free during its early release. No account or card needed. Saved projects and automatic updates are planned.",
  },
  {
    path: "/privacy",
    title: "Data and privacy | Ahead",
    description:
      "Learn where your uploaded file goes, how it is used and what is saved while you work.",
  },
  {
    path: "/methodology",
    title: "How the forecast works | Ahead",
    description:
      "See how Ahead finds trends and repeating patterns in past numbers, makes estimates and checks them against known results.",
  },
];
export const productRoutes = routes;
const Arrow = () => <span aria-hidden="true">↗</span>;
function Launch({
  children = "Try it with your data",
  sample = false,
}: {
  children?: ReactNode;
  sample?: boolean;
}) {
  return (
    <a className="product-button" href={sample ? "/app?sample=1" : "/app"}>
      {children}
      <Arrow />
    </a>
  );
}
function Chart() {
  return (
    <figure className="product-chart">
      <div className="product-chart-heading">
        <span>Weekly orders</span>
        <span className="product-mono">EXAMPLE ONLY</span>
      </div>
      <svg viewBox="0 0 620 310" role="img" aria-labelledby="example-title">
        <title id="example-title">
          Example of past orders and estimated future orders, with a wider range
          further into the future
        </title>
        <g stroke="var(--border)">
          {[60, 120, 180, 240].map((y) => (
            <line key={y} x1="45" y1={y} x2="595" y2={y} />
          ))}
        </g>
        <g fill="var(--text-muted)" fontSize="11" fontFamily="monospace">
          <text x="5" y="64">
            300
          </text>
          <text x="5" y="124">
            200
          </text>
          <text x="5" y="184">
            100
          </text>
          <text x="45" y="278">
            PAST ORDERS
          </text>
          <text x="424" y="278">
            NEXT 8 WEEKS
          </text>
        </g>
        <path
          d="M45 212 L68 193 L91 209 L114 174 L137 181 L160 144 L183 169 L206 132 L229 151 L252 109 L275 131 L298 97 L321 126 L344 89 L367 105 L390 82"
          stroke="var(--text)"
          strokeWidth="2.5"
          fill="none"
        />
        <path
          d="M390 82 L416 65 L442 74 L468 43 L494 56 L520 25 L546 39 L572 17 L595 23 L595 155 L572 140 L546 151 L520 131 L494 144 L468 123 L442 132 L416 106 Z"
          fill="var(--accent-dim)"
        />
        <path
          d="M390 82 L416 85 L442 103 L468 83 L494 100 L520 78 L546 95 L572 78 L595 89"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
        />
        <line
          x1="390"
          y1="22"
          x2="390"
          y2="246"
          stroke="var(--text-faint)"
          strokeDasharray="4 5"
        />
        <circle cx="390" cy="82" r="4" fill="var(--accent)" />
      </svg>
      <figcaption>
        <span>
          <i className="product-key history" />
          Past orders
        </span>
        <span>
          <i className="product-key" />
          Estimate
        </span>
        <span>
          <i className="product-key range" />
          Estimate range
        </span>
      </figcaption>
      <div className="product-chart-note">
        The shaded range shows how much the estimate could vary.
      </div>
    </figure>
  );
}
function Home() {
  return (
    <>
      <section className="product-hero">
        <div>
          <p className="product-eyebrow">MAKE A PLAN FROM YOUR PAST NUMBERS</p>
          <h1>
            See what could
            <br />
            <em>happen next.</em>
          </h1>
          <p className="product-lead">
            Upload past sales or orders. Get an estimate of what comes next,
            then check it against numbers you already know.
          </p>
          <div className="product-actions">
            <Launch />
            <a href="/app?sample=1">
              Try an example <Arrow />
            </a>
          </div>
          <p className="product-caption">Free to try · No account needed</p>
        </div>
        <Chart />
      </section>
      <section className="product-strip">
        <p>Use it to help plan</p>
        <span>Stock</span>
        <span>Staffing</span>
        <span>The weeks ahead</span>
      </section>
      <section className="product-section">
        <div className="product-section-heading">
          <p className="product-eyebrow">THREE SIMPLE STEPS</p>
          <h2>
            Start with
            <br />
            the numbers you have.
          </h2>
        </div>
        <div className="product-steps">
          {[
            [
              "01",
              "Upload your numbers",
              "Save your spreadsheet as a CSV. Use at least 30 numbers, spaced evenly by day, week or month.",
            ],
            [
              "02",
              "Choose what to estimate",
              "Pick the dates and numbers to use, then choose how far ahead to look.",
            ],
            [
              "03",
              "Check it and make a plan",
              "Compare estimates with past results. Download the numbers and a short report to help you plan.",
            ],
          ].map(([n, t, d]) => (
            <div key={n}>
              <span className="product-mono">{n}</span>
              <h3>{t}</h3>
              <p>{d}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="product-split product-section">
        <div>
          <p className="product-eyebrow">PLAN YOUR NEXT STEP</p>
          <h2>
            How much should
            <br />
            we plan for?
          </h2>
        </div>
        <div>
          <p className="product-lead">
            Estimate future orders before buying stock or arranging shifts. Then
            allow for sales events, delivery times and anything else that could
            change the numbers.
          </p>
          <a className="product-text-link" href="/use-cases/demand-planning">
            See how to plan stock and staffing <Arrow />
          </a>
          <p className="product-small">
            A forecast is an estimate. Past numbers cannot tell it about your
            next sale or a new product.
          </p>
        </div>
      </section>
      <section className="product-end">
        <h2>
          See it with an example.
          <br />
          No file needed.
        </h2>
        <Launch sample>Try an example</Launch>
      </section>
    </>
  );
}
function Article({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
}) {
  return (
    <article className="product-article">
      <header>
        <p className="product-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="product-lead">{intro}</p>
      </header>
      <div className="product-prose">{children}</div>
    </article>
  );
}
function Guides() {
  return (
    <Article
      eyebrow="QUICK GUIDES"
      title="A little help getting started."
      intro="Get your file ready and learn what your forecast means."
    >
      <div className="product-guide-list">
        <a href="/guides/prepare-your-csv">
          <span className="product-mono">01 / YOUR FILE</span>
          <h2>
            Prepare your CSV <Arrow />
          </h2>
          <p>Turn a spreadsheet into dates and numbers Ahead can read.</p>
        </a>
        <a href="/guides/read-a-forecast">
          <span className="product-mono">02 / YOUR RESULT</span>
          <h2>
            Read a forecast <Arrow />
          </h2>
          <p>
            Understand the line, the shaded range and how to check the result.
          </p>
        </a>
      </div>
      <p>
        For more detail, see <a href="/methodology">how the forecast works</a>.
      </p>
    </Article>
  );
}
function Content({ path }: { path: string }) {
  if (path === "/") return <Home />;
  if (path === "/guides") return <Guides />;
  if (path === "/use-cases/demand-planning")
    return (
      <Article
        eyebrow="STOCK AND STAFFING"
        title="How much should you plan for?"
        intro="Use past sales or orders to estimate what you may need in the weeks ahead."
      >
        <h2>Start with the decision</h2>
        <p>
          If a delivery takes four weeks, look at estimated sales for the next
          four weeks. To plan shifts, you might look at orders each week. Choose
          numbers that help answer your question.
        </p>
        <h2>Use one set of numbers</h2>
        <p>
          Add up orders for each date before uploading. Use one product, group
          or store at a time. Ahead estimates one column of numbers per run. If
          a date appears more than once, Ahead keeps only its last row, so add
          those sales together in your spreadsheet first.
        </p>
        <h2>Add what you know</h2>
        <p>
          Low sales may mean you ran out of stock. A sale, price change or new
          product may change future orders. Keep a note of these events beside
          your estimate. Compare it with your recent average too.
        </p>
        <h2>Check before you decide</h2>
        <ul>
          <li>
            Choose which past dates to use. Check the estimate against one or
            three past periods where you already know the result.
          </li>
          <li>Look at the estimate and its shaded range.</li>
          <li>
            Check your current stock, incoming deliveries and delivery times.
          </li>
          <li>
            Leave room for surprises. Update your plan when you have new
            numbers.
          </li>
        </ul>
        <p>
          Download a short report with your estimate, checks and chosen dates.
        </p>
        <p>
          You still need to decide how much to buy and how much extra stock to
          keep. Ahead does not make a buying plan across different products.
        </p>
        <Launch sample>Try an example</Launch>
      </Article>
    );
  if (path === "/guides/prepare-your-csv")
    return (
      <Article
        eyebrow="GUIDE / YOUR FILE"
        title="Prepare your CSV."
        intro="A CSV is a simple spreadsheet file. Use one column for dates and another for the numbers you want to estimate."
      >
        <h2>1. Use evenly spaced dates</h2>
        <p>
          Use one row each day, week or month, with at least 30 numbers. More
          history can help show repeating patterns. Having 30 numbers lets you
          start, but does not guarantee a good estimate.
        </p>
        <h2>2. Keep dates and values clear</h2>
        <p>
          Write dates like 2026-01-01. Use plain numbers, such as 1500, without
          currency signs or commas. You can name the columns anything you like;
          you will choose which ones to use after uploading.
        </p>
        <pre>
          {"date,orders\n2026-01-01,142\n2026-01-02,156\n2026-01-03,138\n..."}
        </pre>
        <p className="product-small">
          This shows the format. Your file needs at least 30 numbers.
        </p>
        <h2>3. Add up each day's totals</h2>
        <p>
          If your file lists separate sales, add them up for each day before
          saving it. Ahead keeps only the last row for any repeated date. Keep
          the same unit throughout: do not mix money and items sold in one
          column.
        </p>
        <h2>4. Check missing numbers</h2>
        <p>
          Use zero when you know there were no sales. Leave a blank when the
          number is unknown. Ahead can estimate up to three missing numbers in a
          row using the numbers on either side, and tells you when it does. You
          must fill longer gaps and gaps at the start or end yourself.
        </p>
        <h2>5. Keep only the columns you need</h2>
        <p>
          Remove customer names, emails, addresses and any other columns you do
          not need. The whole file is sent to the server. Save it as a CSV under
          10 MB; see <a href="/privacy">data and privacy</a> for more detail.
        </p>
        <Launch />
      </Article>
    );
  if (path === "/guides/read-a-forecast")
    return (
      <Article
        eyebrow="GUIDE / YOUR RESULT"
        title="What does the forecast mean?"
        intro="A forecast estimates what could happen next using patterns in your past numbers."
      >
        <h2>The line is the estimate</h2>
        <p>
          Each point is an estimate for one future day, week or month. Compare
          it with your latest number and recent average. Use it as a starting
          point for your plan.
        </p>
        <h2>The shaded area is a range</h2>
        <p>
          The range comes from how far the fitted pattern was from past numbers.
          It helps show how much an estimate could vary. Future results can fall
          outside it, especially when something changes. The 80% label describes
          how the range is made; it does not promise that 80% of future results
          will fit inside.
        </p>
        <h2>Choose how far ahead to look</h2>
        <p>
          With daily numbers, 14 steps means the next 14 days. With weekly
          numbers, it means 14 weeks. Choose the length that fits your plan.
          Looking further ahead gives changes more time to affect the result.
        </p>
        <h2>Test against a period you already know</h2>
        <p>
          Use the past-results check to see how close the estimates would have
          been. Ahead hides a recent section of your numbers, estimates it using
          earlier numbers, then compares the two. You can check one or three
          sections. A good past result does not guarantee a good future one.
        </p>
        <h2>Look at the size of the mistakes</h2>
        <p>
          Average error shows how far the estimate was from the real number. For
          example, an average error of 8 orders means it was off by 8 orders on
          average. The range check shows how often the real number fell inside
          the shaded area. See{" "}
          <a href="/methodology">how the checks are calculated</a> for the other
          scores.
        </p>
        <h2>Add what the numbers cannot show</h2>
        <p>
          A sale, a stock shortage or a new supplier can change the pattern.
          Ahead cannot know about these events from past numbers alone. Note
          them beside your estimate and update the plan as new numbers arrive.
        </p>
        <a href="/methodology">
          See how the forecast works <Arrow />
        </a>
      </Article>
    );
  if (path === "/pricing")
    return (
      <Article
        eyebrow="PRICING"
        title="Free to try."
        intro="Ahead is free during this early release. No account or card needed."
      >
        <div className="product-pricing">
          <section>
            <p className="product-eyebrow">AVAILABLE NOW</p>
            <h2>
              Forecasts <span>Free beta</span>
            </h2>
            <ul>
              <li>Upload a CSV and check its numbers</li>
              <li>Estimate one set of numbers using dates you choose</li>
              <li>Check estimates against one or three past periods</li>
              <li>See the estimate and its range on a chart</li>
              <li>Download the results and a short report</li>
              <li>Try an example before uploading your own file</li>
            </ul>
            <Launch />
          </section>
          <section>
            <p className="product-eyebrow">PLANNED / NOT AVAILABLE YET</p>
            <h2>
              Team <span>Price to be announced</span>
            </h2>
            <p>Planned tools for teams that need regular updates:</p>
            <ul>
              <li>Save projects and share them with your team</li>
              <li>Update forecasts automatically</li>
              <li>Estimate several products at once</li>
              <li>Check results as new numbers arrive</li>
            </ul>
            <p className="product-small">
              These tools are not available yet. There is no paid plan or
              waiting list to join.
            </p>
          </section>
        </div>
        <h2>What does beta mean?</h2>
        <p>
          This is an early version, so features and limits may change. We will
          publish prices before offering any paid service.
        </p>
      </Article>
    );
  if (path === "/privacy")
    return (
      <Article
        eyebrow="DATA & PRIVACY"
        title="Know where your data goes."
        intro="Your file is sent to the server running Ahead so it can make the forecast."
      >
        <h2>What is sent</h2>
        <p>
          Uploading sends the whole CSV to the server, even if you choose only
          one column to estimate. Remove any columns you do not need before
          uploading.
        </p>
        <h2>How the application uses it</h2>
        <p>
          The server reads your chosen dates and numbers to make the forecast.
          Ahead has no accounts or feature for saving uploads. It processes your
          file for that request. The server may still use temporary files or
          logs; how long those are kept depends on who hosts it.
        </p>
        <h2>What is stored in the browser</h2>
        <p>
          The page holds your file and results while you work. Files you
          download are saved to your device. Avoid uploading personal or
          confidential information to a public version of Ahead.
        </p>
        <h2>Analytics and advertising</h2>
        <p>
          Ahead has no ads or usage tracking. There are no accounts, payment
          forms or marketing signup forms.
        </p>
        <h2>Details for a hosted service</h2>
        <p>
          Before offering a public service, its host must say who runs it, where
          files are processed, how long records are kept and who to contact
          about privacy. This page describes the software; those details depend
          on the service you use.
        </p>
      </Article>
    );
  return (
    <Article
      eyebrow="METHODOLOGY"
      title="A forecast, with its assumptions in view."
      intro="Ahead uses an independent statistical trend and seasonality engine by default. Test its estimates against your own history before using them to plan."
    >
      <h2>How a forecast is made</h2>
      <ol>
        <li>
          The CSV is parsed and the selected date and numeric columns are
          validated.
        </li>
        <li>
          Observations are sorted by timestamp. Duplicate timestamps keep the
          last row.
        </li>
        <li>
          A regular timeline is created. Small internal gaps may be filled by
          interpolation; warnings explain any cleaning.
        </li>
        <li>
          The selected training period is used to estimate trend and seasonal
          patterns, then project future values.
        </li>
      </ol>
      <h2>Seasonal assumptions</h2>
      <p>
        The default engine uses cadence-based seasonal lags: 24 observations for
        hourly data, 7 for daily, 52 for weekly, 12 for monthly, 4 for quarterly
        and 1 for yearly. The active engine and available history determine
        which seasonal behavior can be used. These assumptions may not match
        your business cycle.
      </p>
      <h2>What the forecast sees</h2>
      <p>
        The forecast uses the selected historical values. The current workflow
        does not supply future promotions, prices, holidays or other external
        variables. Choose training dates that make sense for the business you
        are planning today.
      </p>
      <h2>An empirical uncertainty interval</h2>
      <p>
        The default engine derives an empirical 80% interval from historical
        residuals. It is uncalibrated: an 80% label does not establish 80%
        coverage for future observations. Changes in demand, limited history and
        unusual events can make the interval misleading. Use backtest coverage
        to inspect how it behaved on the selected historical windows.
      </p>
      <h2>Evaluate on held-out history</h2>
      <p>
        Ahead supports one-window and three-window holdout backtests. Each
        window compares forecasts from earlier training data with later actuals.
        MAE reports average absolute error in the original units. sMAPE omits
        pairs where both values are zero; when all pairs are zero, the result is
        unavailable.
      </p>
      <p>
        MASE divides holdout error by a training-only scale based on seasonal
        absolute differences. Below one means error below that scale; it is not
        a direct win against a forecast baseline evaluated on the same holdout.
        Interval coverage reports the proportion of holdout actuals inside the
        forecast band. Evaluation badges describe past performance on selected
        windows, not a promise of future reliability.
      </p>
      <h2>Minimum data and limits</h2>
      <p>
        Use at least 30 valid observations. Forecast length is between 1 and 256
        periods, with the period determined by your data frequency. File uploads
        are limited to 10 MB. Training selection and backtesting need sufficient
        history; a minimum-length series may still be a poor basis for a
        seasonal forecast.
      </p>
      <h2>Optional TimesFM research mode</h2>
      <p>
        TimesFM 3 is an optional research engine, not the default product
        engine. Its weights are subject to noncommercial restrictions; see the{" "}
        <a href="https://huggingface.co/google/timesfm-3.0-pytorch/blob/main/LICENSE">
          official TimesFM 3 license
        </a>{" "}
        before enabling it. The statistical engine does not depend on those
        weights.
      </p>
      <h2>Keep the run details</h2>
      <p>
        The workspace and <a href="/api/health">engine health endpoint</a>{" "}
        identify the active engine. Keep data preparation information, training
        dates and evaluation with exported results. A downloadable Markdown
        planning brief helps carry this context into your team review.
      </p>
      <a href="/guides/read-a-forecast">
        Learn how to read the result <Arrow />
      </a>
    </Article>
  );
}
export default function ProductSite({ path }: { path: string }) {
  return (
    <div className="product-site">
      <a className="product-skip" href="#product-main">
        Skip to content
      </a>
      <header className="product-header">
        <a className="product-brand" href="/" aria-label="Ahead home">
          <span aria-hidden="true">↗</span> ahead
          <span className="product-beta">BETA</span>
        </a>
        <nav aria-label="Main navigation">
          <a
            href="/use-cases/demand-planning"
            aria-current={
              path === "/use-cases/demand-planning" ? "page" : undefined
            }
          >
            Use cases
          </a>
          <a
            href="/guides"
            aria-current={path.startsWith("/guides") ? "page" : undefined}
          >
            Guides
          </a>
          <a
            href="/pricing"
            aria-current={path === "/pricing" ? "page" : undefined}
          >
            Pricing
          </a>
        </nav>
        <a className="product-header-cta" href="/app">
          Open workspace <Arrow />
        </a>
      </header>
      <main id="product-main">
        <Content path={path} />
      </main>
      <footer className="product-footer">
        <div>
          <a className="product-brand" href="/">
            ↗ ahead
          </a>
          <p>Demand planning, from a CSV.</p>
        </div>
        <nav aria-label="Footer navigation">
          <a href="/guides">Guides</a>
          <a href="/methodology">Methodology</a>
          <a href="/privacy">Data & privacy</a>
          <a href="/pricing">Pricing</a>
        </nav>
        <p className="product-small">
          Public beta. Forecasts are estimates,
          <br />
          not guarantees of future demand.
        </p>
      </footer>
    </div>
  );
}
