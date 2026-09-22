import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./styles/App.css";

import Home from "./components/pages/Home";
import Article from "./components/pages/Article";
import CalendarPage from "./components/pages/CalendarPage";
import EditorTexto from "./components/EditorTexto/EditorTexto";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article" element={<Article />} />
        <Route path="/calendarPage" element={<CalendarPage />} />
        <Route path="/editor" element={<EditorTexto />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
