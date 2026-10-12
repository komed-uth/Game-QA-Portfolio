import { useEffect } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import SelfSummary from "./Components/SelfSummary";
import Footer from "./Components/Footer";
import MainPage from "./Pages/MainPage";
import AboutMe from "./Pages/AboutMe";
import QAApproach from "./Pages/QAApproach";
import { personalInfo } from "./data";

export default function App() {
  const { pathname } = useLocation();
  useEffect(() => {
    const pageTitle = pathname === "/about-me" ? "About me · " : pathname === "/about" ? "QA approach · " : "";
    document.title = `${pageTitle}${personalInfo.name}`;
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="site-shell">
      <a
        className="skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault();
          const main = document.getElementById("main-content");
          main?.focus();
          main?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <SelfSummary />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/about" element={<QAApproach />} />
          <Route path="/about-me" element={<AboutMe />} />
          <Route path="*" element={<MainPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
