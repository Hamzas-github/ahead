import { renderToString } from "react-dom/server";
import ProductSite, { routes } from "./product/ProductSite";
export { routes };
export function render(path: string) {
  return renderToString(<ProductSite path={path} />);
}
