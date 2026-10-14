import type { IconName } from "@/components/ui/Icon";

export type AdminNavItem = {
  href: string;
  label: string;
  description: string;
  icon: IconName;
};

export type AdminNavGroup = {
  title: string;
  items: AdminNavItem[];
};

/** Fonte única para a barra lateral e para os cartões do painel de administração. */
export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: "Gestão",
    items: [
      { href: "/admin/unidades", label: "Frações", description: "Códigos e permilagens", icon: "building" },
      { href: "/admin/moradores", label: "Moradores", description: "Contactos por fração", icon: "users" },
    ],
  },
  {
    title: "Financeiro",
    items: [
      { href: "/admin/cobrancas", label: "Cobranças", description: "Quotas e extraordinárias", icon: "receipt" },
      { href: "/admin/pagamentos", label: "Pagamentos", description: "Alocação automática", icon: "wallet" },
      {
        href: "/admin/fundo-caixa",
        label: "Fundo de caixa",
        description: "Numerário, banco, prazo e movimentos",
        icon: "landmark",
      },
      {
        href: "/admin/contas-correntes",
        label: "Contas correntes",
        description: "Extrato por fração",
        icon: "ledger",
      },
      {
        href: "/admin/despesas",
        label: "Despesas",
        description: "Rubricas e faturas (água, luz, …)",
        icon: "tag",
      },
    ],
  },
  {
    title: "Análise",
    items: [
      {
        href: "/admin/relatorios",
        label: "Relatórios",
        description: "CSV, relatório final e novo ano operacional",
        icon: "chart",
      },
    ],
  },
];
