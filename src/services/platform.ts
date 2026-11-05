import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { disable, enable } from "@tauri-apps/plugin-autostart";

export interface Platform {
  setTrayStatus(title: string, tooltip: string, badge: boolean): Promise<void>;
  setAlwaysOnTop(on: boolean): Promise<void>;
  setAutostart(on: boolean): Promise<void>;
  setWindowHeight(height: number): Promise<void>;
}

const WINDOW_WIDTH = 380;

export function createTauriPlatform(): Platform {
  return {
    setTrayStatus: (title, tooltip, badge) => invoke("set_tray_status", { title, tooltip, badge }),
    setAlwaysOnTop: (on) => getCurrentWindow().setAlwaysOnTop(on),
    setAutostart: (on) => (on ? enable() : disable()),
    setWindowHeight: (height) => getCurrentWindow().setSize(new LogicalSize(WINDOW_WIDTH, height)),
  };
}
