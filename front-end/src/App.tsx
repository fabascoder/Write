import Header from "./components/Header";
import MonthSection from "./components/MonthSection";
import { months } from "./data/posts";
import { Route, Routes, BrowserRouter, Router } from "react-router-dom";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <div className="wr-page" id="top">
        <div className="wr-sheet">
          <Header />

          <main className="wr-feed">
            {months.map((month) => (
              <Routes>
                  <Route  path="/" element={<MonthSection key={month.id} month={month} />}/>
              </Routes>
                
            ))}
          </main>
          <footer className="wr-footer">
            <span className="wr-footer-mark">Write.</span>
            <span className="wr-footer-note">fim do arquivo</span>
          </footer>
        </div>
        {/* <Article /> */}
      </div>
    </BrowserRouter>
      
  );
}

export default App;
