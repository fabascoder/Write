import Header from "./Header";
import MonthSection from "./MonthSection";
import { months } from "../data/posts";
import "../App.css";
import { Footer } from "./Footer";
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
          <Footer />
        </div>
        {/* <Article /> */}
      </div>
    </>
      

      
  );
}

export default Home;
