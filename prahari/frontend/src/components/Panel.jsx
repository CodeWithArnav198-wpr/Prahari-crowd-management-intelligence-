export default function Panel({ title, tag, children }) {
  return (
    <div className="bg-panel border border-line rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-lineSoft">
        <h2 className="font-display text-[13px] font-semibold tracking-wide">{title}</h2>
        {tag && <span className="font-mono text-[9.5px] text-textFaint uppercase tracking-wider">{tag}</span>}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
