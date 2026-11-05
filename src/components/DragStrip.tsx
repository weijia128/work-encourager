/**
 * Transparent strip covering the overlay title bar so the frameless-looking
 * window can be dragged from any view (setup, settings, main panel).
 */
export function DragStrip() {
  return <div className="drag-strip" data-tauri-drag-region aria-hidden="true" />;
}
