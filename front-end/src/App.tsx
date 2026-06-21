import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";

import Home from "./components/Home";
import Article from "./components/pages/Article";
import HomePage from "./components/pages/HomePage";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article" element={<Article />} />
        <Route path="/homePage" element={<HomePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;