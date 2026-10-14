import { useState } from "react";
import EvidenceModal from "./EvidenceModal";
import { assetUrl } from "../data";
import type { CaptureEvidence, ReportEvidence } from "../content-schema";

export default function CaptureViewer({ capture }: { capture: CaptureEvidence | ReportEvidence }) {
  const [open, setOpen] = useState(false);
  return <>
    <figure className="capture-media">
      <button type="button" className="evidence-image-button" onClick={() => setOpen(true)} aria-label={capture.openLabel}>
        <img src={assetUrl(capture.path)} alt={capture.alt} loading="lazy" />
      </button>
    </figure>
    {open && <EvidenceModal title={capture.title} source={assetUrl(capture.path)} alt={capture.alt} onClose={() => setOpen(false)} />}
  </>;
}
