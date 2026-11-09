import { useServices } from "../services/ServicesContext";

export function WindowControls() {
  const { platform } = useServices();
  const run = (action: Promise<void>) => void action.catch(() => undefined);

  return (
    <div className="window-controls" aria-label="窗口控制">
      <button
        type="button"
        className="window-close"
        onClick={() => run(platform.closeWindow())}
        aria-label="关闭窗口"
        title="关闭窗口"
      >
        <span aria-hidden="true">×</span>
      </button>
      <button
        type="button"
        className="window-minimize"
        onClick={() => run(platform.minimizeWindow())}
        aria-label="最小化窗口"
        title="最小化窗口"
      >
        <span aria-hidden="true">−</span>
      </button>
      <button
        type="button"
        className="window-maximize"
        onClick={() => run(platform.toggleMaximizeWindow())}
        aria-label="切换最大化"
        title="切换最大化"
      >
        <span aria-hidden="true">+</span>
      </button>
    </div>
  );
}
