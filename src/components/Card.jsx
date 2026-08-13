export default function Card({ className = '', children, ...props }) {
  return (
    <div
      className={`rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-slate-900 ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
