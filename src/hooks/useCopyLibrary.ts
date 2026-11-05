import { useEffect, useState } from "react";
import { BUNDLED_COPY_LIBRARY } from "../domain/copywriter";
import { loadCopyLibrary } from "../services/copyLibrary";
import { httpFetchJson } from "../services/http";
import { useServices } from "../services/ServicesContext";

const REFRESH_INTERVAL = 6 * 60 * 60 * 1000;

export function useCopyLibrary() {
  const { kv } = useServices();
  const [library, setLibrary] = useState(BUNDLED_COPY_LIBRARY);
  useEffect(() => {
    let active = true;
    const update = async () => {
      const next = await loadCopyLibrary(kv, httpFetchJson);
      if (active) setLibrary(next);
    };
    void update();
    const timer = window.setInterval(() => void update(), REFRESH_INTERVAL);
    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, [kv]);
  return library;
}
