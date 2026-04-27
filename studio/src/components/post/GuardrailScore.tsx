export function GuardrailScore({
  green,
  yellow,
  red,
  onDetail,
}: {
  green: number;
  yellow: number;
  red: number;
  onDetail?: () => void;
}) {
  return (
    <div
      className="flex items-center justify-between px-5 py-3.5 rounded-xl border"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-4">
        <span className="text-[13px]">🟢 그린 <b>{green}</b></span>
        <span className="text-[13px]" style={{ color: 'var(--status-yellow)' }}>
          🟡 옐로우 <b>{yellow}</b>
        </span>
        <span
          className="text-[13px]"
          style={{ color: red > 0 ? 'var(--status-red)' : 'var(--text-secondary)' }}
        >
          🔴 레드 <b>{red}</b>
        </span>
      </div>
      {onDetail && (
        <button
          onClick={onDetail}
          className="text-[12px] px-2.5 py-1.5 rounded-md transition-colors
            text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] hover:text-[var(--text-primary)]"
        >
          상세 보기 →
        </button>
      )}
    </div>
  );
}
