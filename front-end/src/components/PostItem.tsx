import "../styles/PostItem.css";
import { NavLink } from "react-router-dom";

export default function PostItem() {
  return (
    <li className="wr-post">
      <span className="wr-node" aria-hidden="true" />

      <NavLink
        to="/article"
        className="wr-post-link"
      >
        <h3 className="wr-post-title">
          Ceguidão.
        </h3>

        <p className="wr-post-meta">
          <span className="wr-post-ago">
            há 2 horas atrás
          </span>

          <span
            className="wr-post-sep"
            aria-hidden="true"
          >
            |
          </span>

          <time className="wr-post-date">
            14 jun 26
          </time>
        </p>
      </NavLink>
    </li>
  );
}