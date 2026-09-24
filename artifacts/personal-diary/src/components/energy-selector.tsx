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
          <p id="energy-selector-title" className="text-[14px] font-semibold text-foreground">Energiya: 10 dan necha?</p>
          <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">O‘zingizga mos raqamni tanlang.</p>
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
            aria-label={`Energiya darajasi ${level}`}
            className={`grid min-h-11 aspect-square place-items-center rounded-xl border text-[14px] font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50 ${value === level ? 'border-[#47796c] bg-[#dcebe4] text-[#35614f] ring-2 ring-[#47796c]/20 dark:bg-[#294538] dark:text-[#b5d9c4]' : 'border-border bg-background text-muted-foreground hover:border-[#8fb59b] hover:text-foreground'}`}
            data-testid={`button-energy-${level}`}
          >
            {level}
          </button>
        ))}
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
        <span>Past</span>
        <span className="font-medium text-foreground">{value === null ? 'Tanlanmagan' : energyWords[value - 1]}</span>
        <span>Yuqori</span>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Faqat shu brauzerda saqlanadi.</p>
    </section>
  );
}