import Header from "./Header";
import MonthSection from "./MonthSection";
import { months } from "../data/posts";
import "../App.css";
// import Article from "./components/pages/Article";

function Home() {
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
          <footer className="wr-footer">
            <span className="wr-footer-mark">Write.</span>
            <span className="wr-footer-note">fim do arquivo</span>
          </footer>
        </div>
        {/* <Article /> */}
      </div>
    </>
      

      
  );
}

export default Home;
