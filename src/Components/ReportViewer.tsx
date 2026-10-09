import { useRef, useState } from "react";
import { reports, reportUrl } from "../data";
import EvidenceModal, { type InspectionPosition } from "./EvidenceModal";

export default function ReportViewer() {
  const [selected, setSelected] = useState(reports.find((report) => report.label === "Very High")!);
  const [open, setOpen] = useState(false);
  const positions = useRef<Record<string, InspectionPosition>>({});
  const url = reportUrl(selected);
  const title = selected.label + (selected.kind === "image" ? " performance summary" : " quality — Samsung Galaxy S10 Performance Advisor report");
  return <>
    <section className="report-controls" aria-labelledby="report-heading">
      <h2 id="report-heading">Performance reports</h2>
      <p className="section-description">Choose a quality setting to view its original Performance Advisor report, or Overall for the combined summary.</p>
      <div className="report-toolbar">
        <div className="report-selector" role="group" aria-label="Graphics quality setting">
          {reports.map((report) => <button key={report.filename} type="button" className="report-button"
            aria-pressed={selected.filename === report.filename} onClick={() => setSelected(report)}>{report.label}</button>)}
        </div>
        <button type="button" className="text-link evidence-open" onClick={() => setOpen(true)}>Open report</button>
      </div>
    </section>
    <section className="report-output" aria-labelledby="report-status">
      <p id="report-status" className="report-status" aria-live="polite">Viewing {selected.label}{selected.kind === "image" ? " summary" : " · Samsung Galaxy S10"}</p>
      <button type="button" className="report-preview" onClick={() => setOpen(true)} aria-label={"Open " + title}>
        <span>{selected.label}</span>
        <span>{selected.kind === "image" ? "Combined performance summary" : "Samsung Galaxy S10 · Performance Advisor"}</span>
        <span>Open report</span>
      </button>
      <p className="report-note">Open the report to inspect its full content. Your inspection position is remembered during this visit.</p>
    </section>
    {open && <EvidenceModal title={title} source={url} kind={selected.kind === "image" ? "summary" : "html"}
      alt="Overall FPS comparison for A32, S10, and S21, followed by Performance Advisor capture summaries and frame rate charts"
      position={positions.current[selected.filename]}
      onPositionChange={(position) => { positions.current[selected.filename] = position; }} onClose={() => setOpen(false)} />}
  </>;
}
