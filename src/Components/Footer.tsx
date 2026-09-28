import { personalInfo } from "../data";

export default function Footer() {
  return (
    <footer>
      <span>{personalInfo.name}</span>
      <span>Manual QA documentation · Work in progress</span>
    </footer>
  );
}
