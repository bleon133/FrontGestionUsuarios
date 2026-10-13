import type { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  children: ReactNode
}

export function Button({ variant = 'primary', type = 'button', children, className, ...rest }: ButtonProps) {
  return (
    <button type={type} className={`${styles[`btn-${variant}`]} ${className ?? ''}`} {...rest}>
      {children}
    </button>
  )
}
