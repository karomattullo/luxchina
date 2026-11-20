import type { ReactNode } from 'react'

type P = { className?: string; filled?: boolean }
function Svg({ children, className = 'h-6 w-6', fill = 'none' }: { children: ReactNode; className?: string; fill?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill={fill} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      {children}
    </svg>
  )
}
export const IconHome = ({ className }: P) => <Svg className={className}><path d="M3 11l9-8 9 8" /><path d="M5 10v10h14V10" /></Svg>
export const IconGrid = ({ className }: P) => <Svg className={className}><rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" /></Svg>
export const IconHeart = ({ className, filled }: P) => <Svg className={className} fill={filled ? 'currentColor' : 'none'}><path d="M12 20.5s-8-4.9-8-10.6A4.4 4.4 0 0 1 12 7.2a4.4 4.4 0 0 1 8 2.7c0 5.7-8 10.6-8 10.6z" /></Svg>
export const IconCart = ({ className }: P) => <Svg className={className}><path d="M3 4h2l2.2 11h10.6L20 7H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></Svg>
export const IconSearch = ({ className }: P) => <Svg className={className}><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></Svg>
export const IconUser = ({ className }: P) => <Svg className={className}><circle cx="12" cy="8" r="4" /><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6" /></Svg>
export const IconTruck = ({ className }: P) => <Svg className={className}><path d="M2 6h11v10H2z" /><path d="M13 9h4l3 3v4h-7" /><circle cx="6.5" cy="17.5" r="1.8" /><circle cx="16.5" cy="17.5" r="1.8" /></Svg>
export const IconBox = ({ className }: P) => <Svg className={className}><path d="M21 8l-9-5-9 5 9 5 9-5z" /><path d="M3 8v8l9 5 9-5V8" /><path d="M12 13v8" /></Svg>
export const IconChat = ({ className }: P) => <Svg className={className}><path d="M4 5h16v11H9l-5 4z" /></Svg>
export const IconTag = ({ className }: P) => <Svg className={className}><path d="M3 12V4h8l10 10-8 8z" /><circle cx="7.5" cy="8.5" r="1.2" /></Svg>
