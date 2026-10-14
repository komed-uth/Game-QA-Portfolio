import { siteContent } from "../data";

export default function Footer() {
  return (
    <footer aria-label={siteContent.footer.regionLabel}>
      <span>{siteContent.identity.name}</span>
    </footer>
  );
}
