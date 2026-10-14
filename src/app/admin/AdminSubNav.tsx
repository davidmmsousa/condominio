"use client";

import { Icon } from "@/components/ui/Icon";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_GROUPS } from "./navItems";

function linkActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminSubNav() {
  const pathname = usePathname() ?? "";

  return (
    <nav className="admin-sidebar" aria-label="Secções de administração">
      <div className="admin-sidebar__group">
        <Link
          href="/admin"
          className={linkActive(pathname, "/admin", true) ? "is-active" : undefined}
          aria-current={linkActive(pathname, "/admin", true) ? "page" : undefined}
        >
          <Icon name="home" size={18} />
          Início
        </Link>
      </div>
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.title} className="admin-sidebar__group">
          <p className="admin-sidebar__label">{group.title}</p>
          {group.items.map(({ href, label, icon }) => {
            const active = linkActive(pathname, href);
            return (
              <Link key={href} href={href} className={active ? "is-active" : undefined} aria-current={active ? "page" : undefined}>
                <Icon name={icon} size={18} />
                {label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
