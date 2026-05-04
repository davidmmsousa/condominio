import { AuthHeader } from "@/components/auth/AuthHeader";
import { AuthHeaderFallback } from "@/components/auth/AuthHeaderFallback";
import { CaptureRecoverySession } from "@/components/auth/CaptureRecoverySession";
import type { ReactNode } from "react";
import { Suspense } from "react";
import { DM_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata = {
  title: "Condomínio",
  description: "Gestão de condomínio (MVP)",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt" className={dmSans.variable}>
      <body className="app-body">
        <Suspense fallback={null}>
          <CaptureRecoverySession />
        </Suspense>
        <Suspense fallback={<AuthHeaderFallback />}>
          <AuthHeader />
        </Suspense>
        {children}
      </body>
    </html>
  );
}
