import { GithubIcon, InstagramIcon } from "../icons";
import UserMenu from "./UserMenu";

// Trilha lateral: a conta no topo e, abaixo, as redes sociais
// (troque os links pelos seus perfis)
export default function SocialRail() {
  return (
    <div className="fc-social">
      <UserMenu lugar="trilho" />

      <a href="https://instagram.com" target="_blank" rel="noreferrer" aria-label="Instagram">
        <InstagramIcon />
      </a>
      <a href="https://github.com" target="_blank" rel="noreferrer" aria-label="GitHub">
        <GithubIcon />
      </a>
    </div>
  );
}
