import { Icon } from "@/components/ui/Icon";
import Link from "next/link";

export function ResidentHubNav() {
  return (
    <Link href="/minha-conta" className="back-link">
      <Icon name="arrowLeft" size={16} />
      Minha conta
    </Link>
  );
}
