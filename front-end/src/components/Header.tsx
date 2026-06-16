import { MoonIcon, HomeIcon } from './icons'
import './Header.css'

// Style only: the buttons are intentionally inert (no handlers / no theme
// state). They carry the visual + accessibility shell for later wiring.
export default function Header() {
  return (
    <header className="wr-header">
      <a className="wr-brand" href="#top">
        Write<span className="wr-brand-dot">.</span>
      </a>

      <nav className="wr-actions" aria-label="Ações">
        <button type="button" className="wr-icon-btn wr-icon-btn--moon" aria-label="Tema escuro">
          <MoonIcon />
        </button>
        <button type="button" className="wr-icon-btn" aria-label="Início">
          <HomeIcon />
        </button>
      </nav>
    </header>
  )
}
