import { Icon } from "./Icon";
import { buttonClass } from "./ui";

/** A plain link: the browser downloads the .xlsx straight from the API route (works without JavaScript). */
export function ExportButton({ href, label }: { href: string; label: string }) {
  return (
    // eslint-disable-next-line @next/next/no-html-link-for-pages
    <a href={href} download className={buttonClass("secondary")}>
      <Icon name="download" />
      <span>{label}</span>
    </a>
  );
}
