import { AuthHeader } from "@/components/auth/AuthHeader";
import type { ReactNode } from "react";

export const metadata = {
  title: "Condomínio",
  description: "Gestão de condomínio (MVP)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0 }}>
        <AuthHeader />
        {children}
      </body>
    </html>
  );
}

