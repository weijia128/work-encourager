export function MonthPrompt({ onConfirm, onEdit }: { onConfirm: () => void; onEdit: () => void }) {
  return (
    <div className="month-prompt">
      <span>本月设置有变化吗？</span>
      <button type="button" onClick={onConfirm}>
        没变化
      </button>
      <button type="button" onClick={onEdit}>
        去修改
      </button>
    </div>
  );
}
