import React from "react";
import ReactDOM from "react-dom/client";
import Root from "./Root";
import "./styles.css";
const content = (
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
const root = document.getElementById("root")!;
if (root.dataset.prerendered) ReactDOM.hydrateRoot(root, content);
else ReactDOM.createRoot(root).render(content);
