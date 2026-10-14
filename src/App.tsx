import { useEffect } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import SelfSummary from "./Components/SelfSummary";
import Footer from "./Components/Footer";
import MainPage from "./Pages/MainPage";
import Skills from "./Pages/Skills";
import AboutMe from "./Pages/AboutMe";
import { siteContent } from "./content/site";
import { aboutMePage } from "./content/pages/aboutMe";
import { evidence as evidenceRecords } from "./content/evidence";
import { assetUrl } from "./data";
import { skillsPage } from "./content/pages/skills";

export default function App() {
  const { pathname, search } = useLocation();
  useEffect(() => {
    const pageTitle = pathname === "/about-me" ? `${aboutMePage.title} · ` : pathname === "/skills" ? `${skillsPage.title} · ` : "";
    document.title = `${pageTitle}${siteContent.identity.name}`;
    document.querySelector('meta[name="description"]')?.setAttribute("content", siteContent.identity.description);
    document.querySelector('link[rel="icon"]')?.setAttribute("href", assetUrl(siteContent.identity.icon));
    const evidence = new URLSearchParams(search).get("evidence");
    if (pathname === "/" && evidenceRecords.some(record => record.anchor === evidence)) {
      const destination = document.getElementById(evidence!);
      destination?.focus({ preventScroll: true });
      destination?.scrollIntoView();
      return;
    }
    window.scrollTo(0, 0);
  }, [pathname, search, aboutMePage.title, skillsPage.title, siteContent.identity.name, siteContent.identity.description, siteContent.identity.icon]);

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
        {siteContent.interface.skipLinkLabel}
      </a>
      <SelfSummary />
      <main id="main-content" tabIndex={-1}>
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/about" element={<Navigate to="/skills" replace />} />
          <Route path="/about-me" element={<AboutMe />} />
          <Route path="*" element={<MainPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
