import { useState } from "react";
import { reports, reportUrl } from "../data";

export default function ReportViewer() {
  const [selected, setSelected] = useState(
    reports.find((report) => report.label === "Medium")!,
  );
  const url = reportUrl(selected.filename);

  return (
    <section className="report-section" aria-labelledby="report-heading">
      <h2 id="report-heading">Performance reports</h2>
      <p className="section-description">
        Choose a quality setting to view its original Performance Advisor
        report.
      </p>
      <div className="report-toolbar">
        <div
          className="report-selector"
          role="group"
          aria-label="Graphics quality setting"
        >
          {reports.map((report) => (
            <button
              key={report.filename}
              type="button"
              className="report-button"
              aria-pressed={selected.filename === report.filename}
              onClick={() => setSelected(report)}
            >
              {report.label}
            </button>
          ))}
        </div>
        <a
          className="text-link"
          href={url}
          target="_blank"
          rel="noopener noreferrer"
        >
          Open full report ↗
        </a>
      </div>
      <p className="report-status" aria-live="polite">
        Viewing {selected.label} · Samsung Galaxy S10
      </p>
      <iframe
        key={selected.filename}
        className="report-viewer"
        src={url}
        title={`${selected.label} quality — Samsung Galaxy S10 Performance Advisor report`}
        loading="lazy"
      />
      <p className="report-note">
        Original capture data with a responsive layout. Open the full report for
        uninterrupted scrolling and detailed inspection.
      </p>
    </section>
  );
}
