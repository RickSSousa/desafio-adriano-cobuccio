'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/wallet.actions';
import { Logo } from '@/components/ui/logo';
import { PageShell } from '@/components/ui/page-shell';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { success: false });

  return (
    <PageShell centered>
      <div className="w-full animate-slide-up">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card">
          <h1 className="heading-lg">Entrar</h1>
          <p className="mt-1 text-sm text-muted">Acesse sua carteira financeira</p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="email" className="label">
                E-mail
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input"
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="label">
                Senha
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            {state.error && <div className="alert-error">{state.error}</div>}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-muted">
            Não tem conta?{' '}
            <Link href="/register" className="link-accent">
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
