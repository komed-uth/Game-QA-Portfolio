import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SelfSummary from "./Components/SelfSummary";
import Footer from "./Components/Footer";
import MainPage from "./Pages/MainPage";
import Skills from "./Pages/Skills";
import { personalInfo } from "./data";

export default function App() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    document.title = `${pathname === "/skills" ? "Skills · " : ""}${personalInfo.name}`;
    const evidence = new URLSearchParams(search).get("evidence");
    if (pathname === "/" && (evidence === "android-reports" || evidence === "pix-capture")) {
      const destination = document.getElementById(evidence);
      destination?.focus({ preventScroll: true });
      destination?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, search]);

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
          <Route path="/skills" element={<Skills />} />
          <Route path="/about" element={<Navigate to="/skills" replace />} />
          <Route path="*" element={<MainPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
