import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-6 px-4 text-center">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-brand-600">Desafio Técnico</p>
        <h1 className="mt-2 text-4xl font-bold">Carteira Financeira</h1>
        <p className="mt-3 text-slate-600">
          Cadastre-se, faça depósitos, transfira saldo e reverta transações com segurança.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/login" className="btn-secondary">
          Entrar
        </Link>
        <Link href="/register" className="btn-primary">
          Criar conta
        </Link>
      </div>
    </main>
  );
}
