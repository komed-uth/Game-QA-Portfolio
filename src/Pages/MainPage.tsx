import { Link } from "react-router-dom";
import FatherSonShowcase from "../Components/FatherSonShowcase";
import PcPerformanceProject from "../Components/PcPerformanceProject";
import RegulusShowcase from "../Components/RegulusShowcase";

export default function MainPage() {
  return (
    <>
      <RegulusShowcase />
      <FatherSonShowcase />
      <PcPerformanceProject />
      <section className="work-in-progress" aria-labelledby="manual-heading">
        <div>
          <p className="eyebrow">Next in the portfolio</p>
          <h2 id="manual-heading">Manual gameplay testing</h2>
        </div>
        <div>
          <span className="status-badge">Work in progress</span>
          <p>
            Test cases, defect reports, and coverage documentation are being
            developed. The QA approach outlines the intended workflow and
            gameplay systems.
          </p>
          <Link to="/about" className="text-link">
            Explore the QA approach →
          </Link>
        </div>
      </section>
    </>
  );
}
