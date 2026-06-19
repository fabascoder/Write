import type { Month } from '../data/posts'
import PostItem from './PostItem'
import '../styles/MonthSection.css'
import { Link, NavLink } from "react-router-dom";
import Article from './pages/Article';


export default function MonthSection({ month }: { month: Month }) {
  return (
    
    <section className="wr-month">
      <h2 className="wr-month-title">{month.name}</h2>
      {/* ordered list: the timeline encodes real chronology */}
      <ol className="wr-timeline">
        {month.posts.map((post) => (
          <NavLink to="/article">
             <PostItem key={post.id} post={post} />
          </NavLink>
         
        ))}
      </ol>
    </section>
    
  )
}
