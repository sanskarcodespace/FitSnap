import Link from "next/link"

export function Logo({ href = "/", light = false }: { href?: string; light?: boolean }) {
  return <Link href={href} className={`brand-logo ${light ? "brand-logo-light" : ""}`} aria-label="FitSnap home">
    <span className="brand-mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M10 22V10h12M10 16h9" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/><path d="m21 21 2 2 4-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></span>
    FitSnap<span className="brand-period">.</span>
  </Link>
}
