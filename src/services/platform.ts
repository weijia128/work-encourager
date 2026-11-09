import { getCurrentWindow } from "@tauri-apps/api/window";
import { LogicalSize } from "@tauri-apps/api/dpi";
import { invoke } from "@tauri-apps/api/core";
import { disable, enable } from "@tauri-apps/plugin-autostart";
import { DEFAULT_WINDOW_WIDTH } from "../domain/windowFit";

export interface Platform {
  setTrayStatus(title: string, tooltip: string, badge: boolean): Promise<void>;
  setAlwaysOnTop(on: boolean): Promise<void>;
  setAutostart(on: boolean): Promise<void>;
  setWindowHeight(height: number): Promise<void>;
  setWindowSize(width: number, height: number): Promise<void>;
  setMinSize(width: number, height: number): Promise<void>;
  setResizable(on: boolean): Promise<void>;
  setShadow(on: boolean): Promise<void>;
  closeWindow(): Promise<void>;
  minimizeWindow(): Promise<void>;
  toggleMaximizeWindow(): Promise<void>;
}

export function createTauriPlatform(): Platform {
  return {
    setTrayStatus: (title, tooltip, badge) => invoke("set_tray_status", { title, tooltip, badge }),
    setAlwaysOnTop: (on) => getCurrentWindow().setAlwaysOnTop(on),
    setAutostart: (on) => (on ? enable() : disable()),
    setWindowHeight: (height) =>
      getCurrentWindow().setSize(new LogicalSize(DEFAULT_WINDOW_WIDTH, height)),
    setWindowSize: (width, height) => getCurrentWindow().setSize(new LogicalSize(width, height)),
    setMinSize: (width, height) => getCurrentWindow().setMinSize(new LogicalSize(width, height)),
    setResizable: (on) => getCurrentWindow().setResizable(on),
    setShadow: (on) => getCurrentWindow().setShadow(on),
    closeWindow: () => getCurrentWindow().close(),
    minimizeWindow: () => getCurrentWindow().minimize(),
    toggleMaximizeWindow: () => getCurrentWindow().toggleMaximize(),
  };
}
