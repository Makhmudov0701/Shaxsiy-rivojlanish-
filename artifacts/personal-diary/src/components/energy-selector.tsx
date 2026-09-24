const energyWords = ['Juda past', 'Past', 'Quvvat kam', 'Biroz past', 'O‘rtacha', 'Yaxshi', 'Tetikka yaqin', 'Tetikka', 'Juda tetik', 'Eng yuqori'];

export function EnergySelector({
  value,
  onChange,
  disabled = false,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
}) {
  return (
    <section className="rounded-2xl border border-card-border bg-card p-5" aria-labelledby="energy-selector-title" data-testid="energy-selector">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p id="energy-selector-title" className="font-mono text-[9px] uppercase tracking-[.16em] text-muted-foreground">Bugungi quvvat</p>
          <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground">1 dan 10 gacha baholang. Bu qayd faqat shu brauzerda saqlanadi.</p>
        </div>
        {value !== null && <span className="font-serif text-3xl leading-none text-[#47796c]" data-testid="text-energy-level">{value}</span>}
      </div>
      <div className="mt-4 grid grid-cols-5 gap-2">
        {Array.from({ length: 10 }, (_, index) => index + 1).map((level) => (
          <button
            key={level}
            type="button"
            onClick={() => onChange(value === level ? null : level)}
            disabled={disabled}
            aria-pressed={value === level}
            aria-label={`Quvvat darajasi ${level}`}
            className={`grid aspect-square place-items-center rounded-xl border text-[12px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${value === level ? 'border-[#47796c] bg-[#dcebe4] text-[#35614f] ring-2 ring-[#47796c]/20 dark:bg-[#294538] dark:text-[#b5d9c4]' : 'border-border bg-background text-muted-foreground hover:border-[#8fb59b] hover:text-foreground'}`}
            data-testid={`button-energy-${level}`}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 text-[9px] text-muted-foreground">
        <span>Quvvatim past</span>
        <span>{value === null ? 'Hozircha belgilanmagan' : energyWords[value - 1]}</span>
        <span>Quvvatim yuqori</span>
      </div>
    </section>
  );
}