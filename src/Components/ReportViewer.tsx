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
      <div className="report-toolbar">
        <div className="report-selector" role="group" aria-label="Graphics quality setting">
          {reports.map((report) => <button key={report.filename} type="button" className="report-button"
            aria-pressed={selected.filename === report.filename} onClick={() => setSelected(report)}>{report.label}</button>)}
        </div>
        <button type="button" className="text-link evidence-open" onClick={() => setOpen(true)} aria-label={"Open " + title}>Open report</button>
      </div>
    </section>
    <section className="report-output" aria-label={title}>
      <span className="visually-hidden" role="status">Selected report: {title}</span>
      <button type="button" className="report-preview" onClick={() => setOpen(true)} aria-label={"Open " + title}>
        Open report
      </button>
    </section>
    {open && <EvidenceModal title={title} source={url} kind={selected.kind === "image" ? "summary" : "html"}
      alt="Overall FPS comparison for A32, S10, and S21, followed by Performance Advisor capture summaries and frame rate charts"
      position={positions.current[selected.filename]}
      onPositionChange={(position) => { positions.current[selected.filename] = position; }} onClose={() => setOpen(false)} />}
  </>;
}
