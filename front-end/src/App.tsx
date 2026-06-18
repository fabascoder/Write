// import Header from './components/Header'
// import MonthSection from './components/MonthSection'
// import { months } from './data/posts'
import Article from './components/pages/Article';

import './App.css'

function App() {
  return (
   
      <div className="wr-page" id="top">
      {/* <div className="wr-sheet">
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
      </div> */}
      <Article />
    </div>
   
    
  )
}

export default App
