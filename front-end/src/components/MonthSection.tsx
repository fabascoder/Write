import type { Month } from '../data/posts'
import PostItem from './PostItem'
import './MonthSection.css'

export default function MonthSection({ month }: { month: Month }) {
  return (
    <section className="wr-month">
      <h2 className="wr-month-title">{month.name}</h2>
      {/* ordered list: the timeline encodes real chronology */}
      <ol className="wr-timeline">
        {month.posts.map((post) => (
          <PostItem key={post.id} post={post} />
        ))}
      </ol>
    </section>
  )
}
