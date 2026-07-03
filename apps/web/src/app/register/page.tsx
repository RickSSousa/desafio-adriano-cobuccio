'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { registerAction } from '@/app/actions/wallet.actions';
import { Logo } from '@/components/ui/logo';
import { PageShell } from '@/components/ui/page-shell';

export default function RegisterPage() {
  const [state, formAction, pending] = useActionState(registerAction, { success: false });

  return (
    <PageShell centered>
      <div className="w-full animate-slide-up">
        <div className="mb-8 flex justify-center">
          <Logo size="lg" />
        </div>

        <div className="card">
          <h1 className="heading-lg">Criar conta</h1>
          <p className="mt-1 text-sm text-muted">Sua carteira será criada automaticamente</p>

          <form action={formAction} className="mt-6 space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Nome
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input"
                placeholder="Seu nome"
                autoComplete="name"
              />
            </div>
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
                minLength={6}
                className="input"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
              />
            </div>
            {state.error && <div className="alert-error">{state.error}</div>}
            <button type="submit" disabled={pending} className="btn-primary w-full">
              {pending ? 'Cadastrando...' : 'Cadastrar'}
            </button>
          </form>

          <div className="divider" />

          <p className="text-center text-sm text-muted">
            Já tem conta?{' '}
            <Link href="/login" className="link-accent">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
