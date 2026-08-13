import logo from '../image/lgoo.png'

export default function LoginTransition() {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-brand-50">
      <img src={logo} alt="" className="h-32 w-32 animate-login-zoom-in object-contain drop-shadow-xl" />
    </div>
  )
}
