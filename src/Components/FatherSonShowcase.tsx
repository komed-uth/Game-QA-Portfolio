import { assetUrl, fatherSonProject } from "../data";
import MediaGallery, { type MediaGalleryItem } from "./MediaGallery";

const media: MediaGalleryItem[] = [
  {
    type: "video",
    source: "https://i.ytimg.com/vi/" + fatherSonProject.videoId + "/hqdefault.jpg",
    label: "Video",
    alt: "Father, Son & Holy Guns video preview",
  },
  {
    type: "image",
    source: assetUrl("images/father-son-holy-guns/boss-battle.png"),
    label: "Boss battle",
    alt: "Father, Son & Holy Guns cooperative battle against the Hunter with a 0.0% sanity meter",
  },
  {
    type: "image",
    source: assetUrl("images/father-son-holy-guns/blessing-selection.png"),
    label: "Blessing selection",
    alt: "Father, Son & Holy Guns blessing selection showing Penitent's Joy, Lone Wolf, and Fortified",
  },
  {
    type: "image",
    source: assetUrl("images/father-son-holy-guns/combat-effects.png"),
    label: "Combat effects",
    alt: "Father, Son & Holy Guns cooperative combat with enemies, bright tornado effects, and the minimap",
  },
];

export default function FatherSonShowcase() {
  return (
    <section
      className="project-grid video-project"
      aria-labelledby="father-son-showcase-title"
    >
      <div className="project-info">
        <p className="eyebrow">Project showcase</p>
        <h2 id="father-son-showcase-title" className="project-title">
          {fatherSonProject.name}
        </h2>
        <div className="project-details" aria-label="Project details">
          {fatherSonProject.details.map(({ label, value }) => (
            <div key={label}>
              <h3 className="project-detail-label">{label}</h3>
              <p>{value}</p>
            </div>
          ))}
        </div>
      </div>
      <MediaGallery
        projectName={fatherSonProject.name}
        galleryName="Father, Son & Holy Guns media"
        videoId={fatherSonProject.videoId}
        media={media}
      />
    </section>
  );
}
