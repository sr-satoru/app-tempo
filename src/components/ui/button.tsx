import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 rounded-lg text-xs font-medium transition-all select-none cursor-pointer active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-[#7C3AED] text-white hover:bg-[#6D28D9] shadow-sm shadow-[#7C3AED]/20',
        outline: 'border border-slate-200 dark:border-[#2D3039] bg-white dark:bg-[#1F2026] text-slate-800 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-[#282a32]',
        secondary: 'bg-slate-100 dark:bg-[#282A32] text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-[#32353e]',
        ghost: 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1F2026]',
        destructive: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 border border-transparent dark:border-red-500/20',
        emerald: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm shadow-emerald-600/20',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-5 text-sm',
        icon: 'h-8 w-8 p-0',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'
