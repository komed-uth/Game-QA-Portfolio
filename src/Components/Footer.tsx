import { personalInfo } from "../data";

export default function Footer() {
  return (
    <footer>
      <span>{personalInfo.name}</span>
    </footer>
  );
}
