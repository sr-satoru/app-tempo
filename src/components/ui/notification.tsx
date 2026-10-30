import { toast, Toaster } from 'sonner'

export { toast, Toaster }

export function NotificationProvider() {
  return (
    <Toaster
      position="top-right"
      richColors
      closeButton
      theme="dark"
      toastOptions={{
        className: '!bg-[#1F2026] !text-white !border-[#2D3039]',
      }}
    />
  )
}
