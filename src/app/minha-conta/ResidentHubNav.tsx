import Link from "next/link";

export function ResidentHubNav() {
  return (
    <p style={{ margin: "0 0 20px" }}>
      <Link href="/minha-conta" className="text-link" style={{ fontSize: 14 }}>
        ← Minha conta
      </Link>
    </p>
  );
}
