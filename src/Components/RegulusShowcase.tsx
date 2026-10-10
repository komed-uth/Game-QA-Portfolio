import { assetUrl, project } from "../data";
import MediaGallery, { type MediaGalleryItem } from "./MediaGallery";
import ReportViewer from "./ReportViewer";

const videoId = "-dEsiPzZ4v8";
const media: MediaGalleryItem[] = [
  {
    type: "video",
    source: "https://i.ytimg.com/vi/" + videoId + "/hqdefault.jpg",
    label: "Video",
    alt: "Regulus the Advent video preview",
  },
  {
    type: "image",
    source: assetUrl("images/regulus/combat.png"),
    label: "Combat",
    alt: "Regulus the Advent party combat with enemies on a raised walkway",
  },
  {
    type: "image",
    source: assetUrl("images/regulus/boss-battle.png"),
    label: "Boss battle",
    alt: "Regulus the Advent boss battle in a fiery arena",
  },
  {
    type: "image",
    source: assetUrl("images/regulus/shop.jpg"),
    label: "Shop",
    alt: "Regulus the Advent shop interface showing Thai text and item bundles",
  },
];

export default function RegulusShowcase() {
  return (
    <section
      className="project-grid regulus-showcase"
      aria-labelledby="regulus-showcase-title"
    >
      <div className="project-info">
        <p className="eyebrow">Project showcase</p>
        <h1 id="regulus-showcase-title" className="project-title">
          {project.name}
        </h1>
        <div className="project-details" aria-label="Project details">
          {project.details.map(({ label, value }) => (
            <div key={label}>
              <h3 className="project-detail-label">{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
        <div className="store-links" aria-label="Get Regulus the Advent">
          <a
            className="store-icon"
            href="https://apps.apple.com/th/app/regulus-the-advent/id6739992769"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on the App Store (opens in a new tab)"
            title="App Store"
          >
            <img src={assetUrl("images/store-badges/app-store-icon.png")} alt="App Store" />
          </a>
          <a
            className="store-icon"
            href="https://play.google.com/store/apps/details?id=com.jj.regulus.android&hl=en"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Regulus the Advent on Google Play (opens in a new tab)"
            title="Google Play"
          >
            <img src={assetUrl("images/store-badges/google-play-icon.svg")} alt="Google Play" />
          </a>
        </div>
      </div>
      <MediaGallery
        projectName={project.name}
        galleryName="Regulus the Advent media"
        videoId={videoId}
        media={media}
      />
      <ReportViewer />
    </section>
  );
}
