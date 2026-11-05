import { useEffect, useState } from "react";
import type { Instrument } from "../domain/settings";
import { useServices } from "../services/ServicesContext";

export function AddInstrumentDialog({
  onAdd,
  onClose,
}: {
  onAdd: (instrument: Instrument) => void;
  onClose: () => void;
}) {
  const { market } = useServices();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Instrument[]>([]);
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      void market
        .search(query.trim())
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [market, query]);
  return (
    <div className="instrument-dialog" role="dialog" aria-label="添加关注品种">
      <div className="dialog-title">
        <b>添加关注品种</b>
        <button type="button" onClick={onClose} aria-label="关闭">
          ×
        </button>
      </div>
      <input
        autoFocus
        aria-label="搜索品种"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="输入名称或代码"
      />
      <div className="instrument-results">
        {results.map((item) => (
          <button type="button" key={item.secid} onClick={() => onAdd(item)}>
            {item.name} <span>{item.secid}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
