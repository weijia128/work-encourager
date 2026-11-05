export function CopyLine({
  texts,
  thirdLabel,
}: {
  texts: readonly [string, string, string];
  thirdLabel: "班味" | "清静";
}) {
  const labels = ["盼头", "烟火", thirdLabel] as const;
  return (
    <div className="copy-lines">
      {texts.map((text, index) => (
        <div className={`copy-line ${labels[index] === "清静" ? "dao" : ""}`} key={labels[index]}>
          <span className="copy-kind">{labels[index]}</span>
          <span>{text}</span>
        </div>
      ))}
    </div>
  );
}
