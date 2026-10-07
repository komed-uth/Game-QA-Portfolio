import { useState } from "react";
import { reports, reportUrl } from "../data";

export default function ReportViewer() {
  const [selected, setSelected] = useState(
    reports.find((report) => report.label === "Very High")!,
  );
  const url = reportUrl(selected);
  const isImage = selected.kind === "image";

  return (
    <>
      <section className="report-controls" aria-labelledby="report-heading">
        <h2 id="report-heading">Performance reports</h2>
        <p className="section-description">
          Choose a quality setting to view its original Performance Advisor
          report, or Overall for the combined summary.
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
          {!isImage && (
            <a
              className="text-link"
              href={url}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open full report ↗
            </a>
          )}
        </div>
      </section>
      <section className="report-output" aria-labelledby="report-status">
        <p id="report-status" className="report-status" aria-live="polite">
          Viewing {selected.label}
          {isImage ? " summary" : " · Samsung Galaxy S10"}
        </p>
        {isImage ? (
          <div
            className="report-viewer overall-report-viewer"
            role="region"
            aria-label="Overall performance report image"
            tabIndex={0}
          >
            <img
              src={url}
              alt="Overall FPS comparison for A32, S10, and S21, followed by Performance Advisor capture summaries and frame rate charts"
            />
          </div>
        ) : (
          <iframe
            key={selected.filename}
            className="report-viewer"
            src={url}
            title={`${selected.label} quality — Samsung Galaxy S10 Performance Advisor report`}
            loading="lazy"
          />
        )}
        <p className="report-note">
          {isImage
            ? "Combined report snapshot. Scroll inside the viewer to inspect the image."
            : "Original capture data with a responsive layout. Open the full report for uninterrupted scrolling and detailed inspection."}
        </p>
      </section>
    </>
  );
}
