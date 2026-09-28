import { project } from "../data";
import ReportViewer from "./ReportViewer";

export default function Game() {
  return (
    <article className="project-grid" aria-labelledby="project-title">
      <div className="project-info">
        <p className="eyebrow">Featured project / 01</p>
        <h1 id="project-title">{project.name}</h1>
        <p className="project-category">{project.category}</p>
        <p className="project-description">{project.description}</p>
        <dl className="info-table">
          <div>
            <dt>Platform</dt>
            <dd>{project.platform}</dd>
          </div>
          <div>
            <dt>Device</dt>
            <dd>{project.device}</dd>
          </div>
          <div>
            <dt>GPU</dt>
            <dd>{project.gpu}</dd>
          </div>
          <div>
            <dt>Capture</dt>
            <dd>{project.tool}</dd>
          </div>
          <div>
            <dt>Scenario</dt>
            <dd>{project.scene}</dd>
          </div>
        </dl>
        <div className="project-tags">
          <span>Real device</span>
          <span>5 quality settings</span>
          <span>Original reports</span>
        </div>
      </div>
      <ReportViewer />
    </article>
  );
}
