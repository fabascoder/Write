import type { Post } from '../data/posts'
import '../styles/PostItem.css'

export default function PostItem({ post }: { post: Post }) {
  return (
    <li className="wr-post">
      {/* the rail segment is drawn by .wr-post::before in CSS */}
      <span className="wr-node" aria-hidden="true" />

      <a className="wr-post-link" href="#post">
        <h3 className="wr-post-title">{post.title}</h3>
        <p className="wr-post-meta">
          <span className="wr-post-ago">{post.ago}</span>
          <span className="wr-post-sep" aria-hidden="true">|</span>
          <time className="wr-post-date">{post.date}</time>
        </p>
      </a>
    </li>
  )
}
