
import '../styles/PostItem.css'

export default function PostItem() {
  return (
    <li className="wr-post">
      {/* the rail segment is drawn by .wr-post::before in CSS */}
      <span className="wr-node" aria-hidden="true" />

      <a className="wr-post-link" href="#post">
        {/* post.title */}
        <h3 className="wr-post-title">Ceguidão.</h3>
        <p className="wr-post-meta">
        {/* post.ago */}
          <span className="wr-post-ago">há 2 horas atrás</span> 
          <span className="wr-post-sep" aria-hidden="true">|</span>
          {/* post.date */}
          <time className="wr-post-date">14 jun 26</time>
        </p>
      </a>
    </li>
  )
}
