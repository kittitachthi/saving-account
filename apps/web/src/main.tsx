import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles/global.css";
import { Application } from "./app/Application.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Application />
  </StrictMode>,
);
