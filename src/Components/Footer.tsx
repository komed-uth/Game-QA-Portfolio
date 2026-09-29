import { personalInfo } from "../data";

export default function Footer() {
  return (
    <footer>
      <span>{personalInfo.name}</span>
      <span>Manual QA documentation · Work in progress</span>
      <span className="store-credits">
        Apple and the Apple logo are trademarks of Apple Inc., registered in the
        U.S. and other countries. App Store is a service mark of Apple Inc.
        Google Play and the Google Play logo are trademarks of Google LLC.
        {" "}©2026 Valve Corporation. Steam and the Steam logo are trademarks
        and/or registered trademarks of Valve Corporation in the U.S. and/or
        other countries.
      </span>
    </footer>
  );
}
