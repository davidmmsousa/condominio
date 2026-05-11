import type { ReactNode } from "react";
import { ResidentQuickPanel } from "./ResidentQuickPanel";

export function ResidentPortalShell({
  children,
  paymentIban,
}: {
  children: ReactNode;
  paymentIban: string | null;
}) {
  return (
    <div className="resident-portal-layout">
      <div className="resident-portal-layout__main">{children}</div>
      <ResidentQuickPanel paymentIban={paymentIban} />
    </div>
  );
}
