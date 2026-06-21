import Header from "../layout/Header";
import MonthSection from "../MonthSection";
import { months } from "../../data/posts";
import "../../styles/App.css";
import { Footer } from "../layout/Footer";

function CalendarPage() {
  return (
    <>
    <div className="wr-page" id="top">
        <div className="wr-sheet">
          <Header />

          <main className="wr-feed">
            {months.map((month) => (
              <MonthSection key={month.id} month={month} />
            ))}
          
          </main>
          <Footer />
        </div>
        {/* <Article /> */}
      </div>
    </>
      

      
  );
}

export default CalendarPage;
