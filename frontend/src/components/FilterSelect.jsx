export default function FilterSelect({ label, icon, value, onChange, children, className = '' }) {
  return (
    <label className={`group relative flex min-w-[10.5rem] flex-col gap-1 ${className}`}>
      <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        {icon}
        {label}
      </span>
      <div className="relative">
        <select
          value={value}
          onChange={onChange}
          className="w-full appearance-none rounded-lg border border-slate-700/80 bg-slate-800/90 py-2 pl-3 pr-9 text-sm text-slate-200 shadow-sm outline-none transition hover:border-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
        >
          {children}
        </select>
        <svg
          className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </div>
    </label>
  );
}
