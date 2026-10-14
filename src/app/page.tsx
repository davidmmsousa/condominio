import { Icon } from "@/components/ui/Icon";
import { createServerRouteSupabaseClient } from "@/lib/supabase/server-client";
import Link from "next/link";

export default async function HomePage() {
  const supabase = await createServerRouteSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = user
    ? await supabase.from("profiles").select("role").eq("user_id", user.id).maybeSingle()
    : { data: null };

  const isAdmin = Boolean(user) && profile?.role === "admin";
  const isResident = Boolean(user) && profile?.role === "resident";

  return (
    <main className="page-shell page-shell--compact">
      <section className="hero">
        <span className="hero__eyebrow">
          <Icon name="building" size={15} />
          Gestão de condomínio
        </span>
        <h1 className="hero__title">Quotas, pagamentos e recibos num só lugar.</h1>
        <p className="hero__lead">
          A administração regista cobranças e pagamentos; cada morador consulta a sua conta corrente e descarrega os
          recibos quando quiser.
        </p>
        <div className="hero__actions">
          {isAdmin ? (
            <Link href="/admin" className="btn btn--lg btn--light">
              Abrir administração
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : null}
          {isResident ? (
            <Link href="/minha-conta" className="btn btn--lg btn--light">
              Abrir a minha conta
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : null}
          {!user ? (
            <Link href="/entrar" className="btn btn--lg btn--light">
              Entrar
              <Icon name="arrowRight" size={18} />
            </Link>
          ) : null}
        </div>
      </section>

      <div className="feature-grid">
        <article className="feature">
          <span className="feature__icon">
            <Icon name="wallet" />
          </span>
          <h2>Cobranças e pagamentos</h2>
          <p>Quotas repartidas por permilagem e pagamentos alocados automaticamente às cobranças em aberto.</p>
        </article>
        <article className="feature">
          <span className="feature__icon">
            <Icon name="file" />
          </span>
          <h2>Recibos em PDF</h2>
          <p>Cada pagamento gera um recibo que a administração envia por email e o morador pode descarregar.</p>
        </article>
        <article className="feature">
          <span className="feature__icon">
            <Icon name="chart" />
          </span>
          <h2>Contas claras</h2>
          <p>Fundo de caixa, despesas e relatórios anuais para a prestação de contas do condomínio.</p>
        </article>
      </div>
    </main>
  );
}
