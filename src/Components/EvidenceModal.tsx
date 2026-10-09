import { useEffect, useId, useRef, useState } from "react";

export type InspectionPosition = { left: number; top: number };
type EvidenceModalProps = {
  title: string;
  source: string;
  kind?: "image" | "html" | "summary";
  alt?: string;
  position?: InspectionPosition;
  onPositionChange?: (position: InspectionPosition) => void;
  onClose: () => void;
  onPrevious?: () => void;
  onNext?: () => void;
};

export default function EvidenceModal({ title, source, kind = "image", alt = "", position,
  onPositionChange, onClose, onPrevious, onNext }: EvidenceModalProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const [closing, setClosing] = useState(false);
  const callbacks = useRef({ onClose, onPrevious, onNext });
  callbacks.current = { onClose, onPrevious, onNext };
  const closingRef = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const frameCleanup = useRef<() => void>();
  const saveFramePosition = useRef<() => void>();

  function close() {
    if (closingRef.current) return;
    saveFramePosition.current?.();
    closingRef.current = true;
    setClosing(true);
    timer.current = setTimeout(() => callbacks.current.onClose(),
      window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 200);
  }

  useEffect(() => {
    const element = dialog.current!;
    const opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const { scrollX, scrollY } = window;
    const oldOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    element.showModal();
    function keydown(event: KeyboardEvent) {
      if (event.key === "Tab") {
        const controls = Array.from(element.querySelectorAll<HTMLElement>('button, a[href], iframe, [tabindex="0"]'));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
      if (event.key === "Escape") { event.preventDefault(); close(); }
      if (event.key === "ArrowLeft" && callbacks.current.onPrevious) {
        event.preventDefault(); callbacks.current.onPrevious();
      }
      if (event.key === "ArrowRight" && callbacks.current.onNext) {
        event.preventDefault(); callbacks.current.onNext();
      }
    }
    element.addEventListener("keydown", keydown);
    return () => {
      clearTimeout(timer.current);
      frameCleanup.current?.();
      element.removeEventListener("keydown", keydown);
      element.close();
      document.documentElement.style.overflow = oldOverflow;
      opener?.focus({ preventScroll: true });
      window.scrollTo(scrollX, scrollY);
    };
  }, []);

  useEffect(() => {
    if (kind === "summary" && viewport.current) {
      viewport.current.scrollTo(position?.left ?? 0, position?.top ?? 0);
    }
  }, [source, kind]);

  function connectReport(frame: HTMLIFrameElement) {
    frameCleanup.current?.();
    const reportWindow = frame.contentWindow;
    if (!reportWindow) return;
    reportWindow.scrollTo(position?.left ?? 0, position?.top ?? 0);
    const save = () => onPositionChange?.({ left: reportWindow.scrollX, top: reportWindow.scrollY });
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Tab") {
        const reportDocument = frame.contentDocument!;
        const controls = Array.from(reportDocument.querySelectorAll<HTMLElement>('a[href], button, input, select, textarea, [tabindex]'))
          .filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0 && !element.matches(':disabled'));
        const active = reportDocument.activeElement;
        if (event.shiftKey && (active === controls[0] || active === reportDocument.body)) {
          event.preventDefault(); dialog.current?.querySelector<HTMLButtonElement>('.evidence-modal-header button')?.focus();
        } else if (!event.shiftKey && (active === controls[controls.length - 1] || controls.length === 0)) {
          event.preventDefault(); dialog.current?.querySelector<HTMLAnchorElement>('.evidence-modal-footer a')?.focus();
        }
      }
      if (event.key === "Escape") {
        event.preventDefault(); event.stopImmediatePropagation(); close();
      }
    };
    saveFramePosition.current = save;
    reportWindow.addEventListener("scroll", save);
    reportWindow.addEventListener("keydown", keydown, true);
    frameCleanup.current = () => {
      reportWindow.removeEventListener("scroll", save);
      reportWindow.removeEventListener("keydown", keydown, true);
    };
  }

  return (
    <dialog ref={dialog} className={"evidence-modal" + (closing ? " is-closing" : "")}
      aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); close(); }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const bounds = event.currentTarget.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right ||
            event.clientY < bounds.top || event.clientY > bounds.bottom) close();
      }}>
      <header className="evidence-modal-header">
        <h2 id={titleId}>{title}</h2>
        <button type="button" autoFocus onClick={close} aria-label="Close evidence">×</button>
      </header>
      <div ref={viewport} className={"evidence-modal-content evidence-modal-" + kind}
        tabIndex={kind === "summary" ? 0 : undefined}
        aria-label={kind === "summary" ? title + " scrollable summary" : undefined}
        onScroll={kind === "summary" ? (event) => onPositionChange?.({
          left: event.currentTarget.scrollLeft, top: event.currentTarget.scrollTop }) : undefined}>
        {kind === "html" ? <iframe key={source} src={source} title={title}
          onLoad={(event) => connectReport(event.currentTarget)} /> :
          <img key={source} src={source} alt={alt} onLoad={() => {
            if (kind === "summary") viewport.current?.scrollTo(position?.left ?? 0, position?.top ?? 0);
          }} />}
      </div>
      <footer className="evidence-modal-footer">
        {onPrevious && <button type="button" onClick={onPrevious}>Previous screenshot</button>}
        {onNext && <button type="button" onClick={onNext}>Next screenshot</button>}
        <a href={source} target="_blank" rel="noopener noreferrer">Open original in new tab ↗</a>
      </footer>
    </dialog>
  );
}
