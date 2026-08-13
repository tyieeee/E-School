import { Link } from 'react-router-dom'
import logo from '../image/lgoo.png'

export default function BrandMark({ className = '' }) {
  return (
    <Link
      to="/"
      className={`inline-flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 shadow-lg shadow-black/20 transition-opacity hover:opacity-90 ${className}`}
    >
      <img src={logo} alt="" className="h-5 w-5 object-contain" />
      <span className="text-sm font-bold tracking-tight text-white">E-School</span>
    </Link>
  )
}
