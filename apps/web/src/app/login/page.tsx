'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { loginAction } from '@/app/actions/wallet.actions';

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(loginAction, { success: false });

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="card w-full">
        <h1 className="text-2xl font-bold">Entrar</h1>
        <p className="mt-1 text-sm text-slate-600">Acesse sua carteira financeira</p>

        <form action={formAction} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">E-mail</label>
            <input name="email" type="email" required className="input" placeholder="voce@email.com" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Senha</label>
            <input name="password" type="password" required className="input" placeholder="••••••••" />
          </div>
          {state.error && <p className="text-sm text-red-600">{state.error}</p>}
          <button type="submit" disabled={pending} className="btn-primary w-full">
            {pending ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-slate-600">
          Não tem conta?{' '}
          <Link href="/register" className="font-medium text-brand-600 hover:underline">
            Cadastre-se
          </Link>
        </p>
      </div>
    </main>
  );
}
