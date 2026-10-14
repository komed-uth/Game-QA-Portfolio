import { useRef, useState } from "react";
import { assetUrl } from "../data";
import type { ReportEvidence } from "../content-schema";
import EvidenceModal, { type InspectionPosition } from "./EvidenceModal";

export default function ReportViewer({ evidence }: { evidence: ReportEvidence }) {
  const reports = evidence.reports;
  const [selectedId, setSelectedId] = useState(evidence.defaultReportId);
  const selected = reports.find(report => report.id === selectedId) ?? reports.find(report => report.id === evidence.defaultReportId)!;
  const [open, setOpen] = useState(false);
  const positions = useRef<Record<string, InspectionPosition>>({});
  const url = assetUrl(selected.path);
  const title = selected.label + (selected.kind === "image" ? " " + evidence.summaryTitle : " " + evidence.reportTitle);
  return <>
    <section id={evidence.anchor} tabIndex={-1} className="report-block" aria-labelledby={evidence.headingId}>
      <h2 id={evidence.headingId} className="report-heading">{evidence.heading}</h2>
      <section className="report-output" aria-label={title}>
        <span className="visually-hidden" role="status">{evidence.selectedLabel} {title}</span>
        <button type="button" className="report-preview" onClick={() => setOpen(true)} aria-label={evidence.openAction + " " + title}>
          {evidence.openLabel}
        </button>
      </section>
      <div className="report-controls">
        <div className="report-toolbar">
          <div className="report-selector" role="group" aria-label={evidence.selectorLabel}>
            {reports.map((report) => <button key={report.id} type="button" className="report-button"
              aria-pressed={selected.id === report.id} onClick={() => setSelectedId(report.id)}>{report.label}</button>)}
          </div>
          <button type="button" className="text-link evidence-open" onClick={() => setOpen(true)} aria-label={evidence.openAction + " " + title}>{evidence.openLabel}</button>
        </div>
      </div>
    </section>
    {open && <EvidenceModal title={title} source={url} kind={selected.kind === "image" ? "summary" : "html"}
      alt={evidence.summaryAlt}
      position={positions.current[selected.id]}
      onPositionChange={(position) => { positions.current[selected.id] = position; }} onClose={() => setOpen(false)} />}
  </>;
}
