import type { ReactNode } from "react";
import { ResidentQuickPanel } from "./ResidentQuickPanel";

export function ResidentPortalShell({ children }: { children: ReactNode }) {
  return (
    <div className="resident-portal-layout">
      <div className="resident-portal-layout__main">{children}</div>
      <ResidentQuickPanel />
    </div>
  );
}
