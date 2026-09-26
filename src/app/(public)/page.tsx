import Link from "next/link"
import { ArrowUpRight, Camera, Check, MoveUpRight, Leaf, ScanLine, TrendingUp, Users, ArrowRight } from "lucide-react"
import { MarketingLayout } from "@/components/layout/marketing-layout"

export default function HomePage() {
  return <MarketingLayout>
    <section className="home-hero">
      <div className="hero-copy">
        <p className="eyebrow"><span className="tiny-dot"/> A little better, every day</p>
        <h1>Good habits.<br />Real food.<br /><em>A better you.</em></h1>
        <p className="hero-description">Your food, movement, and progress. Finally in one thoughtful space. Build a routine that feels as good as it looks.</p>
        <div className="hero-links"><Link href="/signup" className="hero-primary">Find your rhythm <ArrowUpRight size={19}/></Link><Link href="/how-it-works" className="hero-secondary">Take a look <ArrowRight size={16}/></Link></div>
        <div className="hero-caption"><span><Check size={14}/> For individuals</span><span><Check size={14}/> Built for coaches, too</span></div>
      </div>
      <div className="hero-visual" aria-label="Illustration of a balanced meal and the FitSnap food review flow">
        <div className="visual-topline"><span>THE EVERYDAY EDIT</span><Leaf size={20}/></div>
        <div className="meal-art">
          <svg viewBox="0 0 440 440" role="img" aria-label="Illustrated plate with vegetables, grains and salmon">
            <defs>
              <radialGradient id="plate"><stop stopColor="#fffef6"/><stop offset=".8" stopColor="#f5f3e6"/><stop offset="1" stopColor="#e3e1d0"/></radialGradient>
              <linearGradient id="salmon" x2="1" y2="1"><stop stopColor="#edb078"/><stop offset="1" stopColor="#d4784c"/></linearGradient>
              <filter id="plate-shadow"><feDropShadow dx="0" dy="10" stdDeviation="13" floodColor="#273517" floodOpacity=".2"/></filter>
            </defs>
            <circle cx="220" cy="220" r="180" fill="url(#plate)" filter="url(#plate-shadow)"/>
            <circle cx="220" cy="220" r="149" fill="none" stroke="#e2e1d3" strokeWidth="2"/>
            {Array.from({length: 38}, (_, i) => { const a=i*2.4;const r=18+Math.sqrt(i)*10;return <ellipse key={i} cx={150+Math.cos(a)*r} cy={178+Math.sin(a)*r} rx="13" ry="5" transform={`rotate(${i*31} ${150+Math.cos(a)*r} ${178+Math.sin(a)*r})`} fill={i%3===0?"#d4c69b":"#e9dbb4"} stroke="#c2b184" strokeWidth=".7"/>})}
            <g transform="rotate(-25 268 210)"><rect x="207" y="139" width="115" height="139" rx="33" fill="url(#salmon)"/>{[165,190,215,240].map(y=><path key={y} d={`M219 ${y}q42 22 91 0`} stroke="#ffe0b0" strokeWidth="5" fill="none"/>)}<path d="m218 258 85 0" stroke="#91492e" strokeWidth="5"/></g>
            {[0,1,2,3,4,5,6].map(i=><g key={i} transform={`translate(${133+i*21} ${286+Math.sin(i)*17}) rotate(${i*29})`}><ellipse rx="16" ry="28" fill={i%2?"#486d36":"#65854b"}/><path d="M0-20V23" stroke="#92aa67" strokeWidth="2"/></g>)}
            <g fill="#d8784b" stroke="#efaa77" strokeWidth="3"><circle cx="133" cy="250" r="17"/><circle cx="169" cy="276" r="15"/><circle cx="294" cy="301" r="16"/></g>
            <path d="M286 116a37 37 0 0 1 47 38l-47-38" fill="#e8ce70" stroke="#faf0b0" strokeWidth="5"/>
          </svg>
        </div>
        <div className="scan-corner tl"/><div className="scan-corner br"/>
        <div className="meal-caption"><span>LUNCH, WITH A LITTLE INTENTION</span><h2>Your plate.<br />A clearer picture.</h2></div>
        <div className="floating-review"><span className="review-icon"><ScanLine size={22}/></span><div><strong>Snap. Match. Confirm.</strong><p>Nutrition with a source.</p></div><Check size={18}/></div>
        <span className="visual-footnote">Illustration · confirm food and weight before logging</span>
      </div>
    </section>
    <div className="home-strip"><span>A more considered way to feel well</span><span>Food journal</span><span>Daily habits</span><span>Meaningful progress</span><span>Connected coaching</span></div>
    <section className="home-features">
      <div className="features-heading"><div><p className="eyebrow section-label">LESS FRICTION. MORE LIVING.</p><h2>A whole picture.<br />A simpler everyday.</h2></div><p>Wellbeing isn’t one perfect day. It’s the little things you come back to. Keep yours together.</p></div>
      <div className="feature-grid">
        <Link href="/how-it-works" className="feature-tile feature-food"><Camera/><span className="feature-index">01 / NOURISH</span><h3>Know your plate.</h3><p>Start with a photo. Choose a food record, confirm the portion, and keep the source in view.</p><span className="tile-arrow"><MoveUpRight/></span></Link>
        <Link href="/signup" className="feature-tile"><TrendingUp/><span className="feature-index">02 / GROW</span><h3>Notice the small wins.</h3><p>A calmer view of your habits and progress. A little perspective for the days that matter.</p><div className="mini-chart" aria-hidden="true">{[28,48,36,63,56,79,95].map((v,i)=><span key={i} style={{height:v}}/>)}</div><span className="tile-arrow"><MoveUpRight/></span></Link>
        <Link href="/for-coaches" className="feature-tile feature-coach"><Users/><span className="feature-index">03 / CONNECT</span><h3>Better, together.</h3><p>Plans, check-ins, and conversations in one home for you and your coach.</p><span className="tile-arrow"><MoveUpRight/></span></Link>
      </div>
    </section>
    <section className="home-final"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>Make yourself<br /><em>a little more space.</em></h2><Link href="/signup" className="hero-primary">Start with today <ArrowUpRight size={19}/></Link></section>
  </MarketingLayout>
}
