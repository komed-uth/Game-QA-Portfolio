import { siteContent } from "../content/site";

export default function Footer() {
  return (
    <footer aria-label={siteContent.footer.regionLabel}>
      <span>{siteContent.identity.name}</span>
    </footer>
  );
}
