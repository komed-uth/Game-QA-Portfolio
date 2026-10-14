import { useRef, useState } from "react";
import { assetUrl } from "../data";
import type { ReportEvidence } from "../content-schema";
import EvidenceModal, { type InspectionPosition } from "./EvidenceModal";

export default function ReportViewer({ evidence }: { evidence: ReportEvidence }) {
  const [open, setOpen] = useState(false);
  const position = useRef<InspectionPosition>();
  return <>
    <button type="button" className="text-link evidence-open" onClick={() => setOpen(true)}
      aria-label={evidence.report.openLabel + " — " + evidence.report.title}>{evidence.report.openLabel}</button>
    {open && <EvidenceModal title={evidence.report.title} source={assetUrl(evidence.report.path)} kind="html"
      position={position.current} onPositionChange={value => { position.current = value; }} onClose={() => setOpen(false)} />}
  </>;
}
