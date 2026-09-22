import { GithubIcon, InstagramIcon } from "../icons";

// Trilha lateral de redes sociais (troque os links pelos seus perfis)
export default function SocialRail() {
  return (
    <div className="fc-social" aria-label="Redes sociais">
      <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
        <InstagramIcon />
      </a>
      <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
        <GithubIcon />
      </a>
    </div>
  );
}
