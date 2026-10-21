import { lazy, Suspense, useEffect } from "react";
import ProductSite, { routes } from "./product/ProductSite";
const Workspace = lazy(() => import("./App"));

export function NotFound() {
  return (
    <main
      className="product-site"
      style={{ padding: "64px 24px", minHeight: "100vh" }}
    >
      <p>404 / Page not found</p>
      <h1>This page isn't here.</h1>
      <p style={{ marginTop: 24 }}>Your next forecast is one click away.</p>
      <a className="product-button" href="/">
        Back to Ahead
      </a>
    </main>
  );
}
export default function Root() {
  const path = location.pathname.replace(/\/$/, "") || "/";
  const route = routes.find((r) => r.path === path);
  useEffect(() => {
    document.title =
      path === "/app"
        ? "Forecast workspace | Ahead"
        : (route?.title ?? "Page not found | Ahead");
    const meta = document.querySelector('meta[name="description"]');
    meta?.setAttribute(
      "content",
      route?.description ??
        "Forecast, test against past data, and export a planning brief.",
    );
    if (path === "/app" || !route)
      document
        .querySelector('meta[name="robots"]')
        ?.setAttribute("content", "noindex, follow");
  }, [path, route]);
  return path === "/app" ? (
    <Suspense
      fallback={
        <main className="product-site" style={{ padding: 32 }}>
          Opening your workspace…
        </main>
      }
    >
      <Workspace />
    </Suspense>
  ) : route ? (
    <ProductSite path={path} />
  ) : (
    <NotFound />
  );
}
