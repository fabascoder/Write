import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./styles/App.css";

import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import CalendarPage from "./components/pages/CalendarPage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article" element={<Article />} />
        <Route path="/calendarPage" element={<CalendarPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;