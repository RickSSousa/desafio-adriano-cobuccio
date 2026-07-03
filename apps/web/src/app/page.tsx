import Link from 'next/link';
import { Logo } from '@/components/ui/logo';
import { PageShell } from '@/components/ui/page-shell';

export default function HomePage() {
  return (
    <PageShell className="flex min-h-screen flex-col" wide>
      <header className="relative z-10 mx-auto flex w-full max-w-6xl items-center justify-between py-6">
        <Logo size="md" />
        <div className="flex gap-3">
          <Link href="/login" className="btn-ghost">
            Entrar
          </Link>
          <Link href="/register" className="btn-primary">
            Criar conta
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex flex-1 w-full max-w-6xl flex-col items-center justify-center px-4 pb-20 text-center">
        <div className="animate-fade-in">
          <p className="section-title">Desafio Técnico</p>
          <h1 className="heading-xl mt-4">
            Sua carteira digital,
            <br />
            <span className="bg-gradient-to-r from-accent-400 to-glow-cyan bg-clip-text text-transparent">
              segura e inteligente
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted">
            Cadastre-se, faça depósitos, transfira saldo e reverta transações com total
            transparência no ledger.
          </p>
        </div>

        <div className="mt-10 flex animate-slide-up flex-wrap justify-center gap-4 [animation-delay:150ms]">
          <Link href="/register" className="btn-primary px-8 py-3 text-base">
            Começar agora
          </Link>
          <Link href="/login" className="btn-secondary px-8 py-3 text-base">
            Já tenho conta
          </Link>
        </div>

        <div className="mt-20 grid w-full max-w-3xl animate-slide-up gap-4 sm:grid-cols-3 [animation-delay:300ms]">
          {[
            { title: 'Depósitos', desc: 'Adicione saldo a qualquer momento' },
            { title: 'Transferências', desc: 'Envie para outros usuários por e-mail' },
            { title: 'Reversões', desc: 'Estorne transações com compensação' },
          ].map((feature) => (
            <div key={feature.title} className="card text-left">
              <div className="mb-3 h-1 w-8 rounded-full bg-gradient-to-r from-accent-500 to-glow-cyan" />
              <h3 className="heading-md text-base">{feature.title}</h3>
              <p className="mt-1 text-sm text-muted">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </PageShell>
  );
}
