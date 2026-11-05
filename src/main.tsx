import React from "react";
import ReactDOM from "react-dom/client";
import "./styles.css";
import App from "./App";
import { DragStrip } from "./components/DragStrip";
import { createEastmoneyProvider } from "./services/eastmoney";
import { httpFetchJson } from "./services/http";
import { createTauriStore } from "./services/kvStore";
import { createTauriPlatform } from "./services/platform";
import { ServicesProvider, type Services } from "./services/ServicesContext";

async function bootstrap() {
  try {
    const services: Services = {
      kv: await createTauriStore(),
      market: createEastmoneyProvider(httpFetchJson),
      platform: createTauriPlatform(),
      now: () => new Date(),
    };
    ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
      <React.StrictMode>
        <ServicesProvider services={services}>
          <DragStrip />
          <App />
        </ServicesProvider>
      </React.StrictMode>,
    );
  } catch {
    const root = document.getElementById("root");
    if (root)
      root.innerHTML =
        '<main class="container"><p role="alert">设置加载失败，请重启应用后重试</p></main>';
  }
}

void bootstrap();
