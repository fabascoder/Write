import { Route, Routes, BrowserRouter } from "react-router-dom";
import "./App.css";

import Home from "./components/Home";
import Article from "./components/pages/Article";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/article" element={<Article />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;