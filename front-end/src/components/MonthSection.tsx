import type { Month } from "../data/posts";
import PostItem from "./PostItem";
import "../styles/MonthSection.css";
// import Article from './pages/Article';

export default function MonthSection({ month }: { month: Month }) {
  return (
    <section className="wr-month">
      <h2 className="wr-month-title">{month.name}</h2>
      <ol className="wr-timeline">
        <PostItem />
      </ol>
    </section>
  );
}
