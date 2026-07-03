'use client';

import { Toaster } from 'sonner';

export function AppToaster() {
  return (
    <Toaster
      theme="dark"
      position="top-right"
      richColors
      closeButton
      toastOptions={{
        classNames: {
          toast:
            'group !bg-vault-900/95 !border !border-white/10 !text-vault-50 !shadow-card !backdrop-blur-md',
          title: '!text-vault-50 !font-semibold',
          description: '!text-vault-400',
          actionButton: '!bg-accent-600 !text-vault-950',
          cancelButton: '!bg-vault-700 !text-vault-200',
          closeButton:
            '!bg-vault-800 !border-white/10 !text-vault-400 hover:!text-vault-200',
        },
      }}
    />
  );
}
