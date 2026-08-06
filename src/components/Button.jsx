const variants = {
  primary: 'bg-brand-600 hover:bg-brand-700 text-white focus-visible:outline-brand-600',
  calm: 'bg-calm-500 hover:bg-calm-600 text-white focus-visible:outline-calm-500',
  urgent: 'bg-urgent-600 hover:bg-urgent-700 text-white focus-visible:outline-urgent-600',
  secondary: 'bg-white hover:bg-brand-50 text-brand-700 border border-brand-200 focus-visible:outline-brand-600',
  ghost: 'bg-transparent hover:bg-brand-100 text-brand-700 focus-visible:outline-brand-600',
}

export default function Button({
  variant = 'primary',
  className = '',
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-base font-semibold shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  )
}
