import MonthSection from "../MonthSection";
import { months } from "../../data/posts";
import "../../styles/App.css";
import { Head } from "../layout/Head";

function CalendarPage() {
  return (
    <>
      <Head
        title="Calendário"
        description="Essa é a ordem de postagem dos artigos"
      />

      <main className="wr-feed">
        {months.map((month) => (
          <MonthSection key={month.id} month={month} />
        ))}
      </main>
    </>
  );
}

export default CalendarPage;
