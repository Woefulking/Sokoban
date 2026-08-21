import type { ButtonHTMLAttributes } from 'react';

export const ButtonVariants = {
  GREEN: 'green',
  ORANGE: 'orange',
  BLUE: 'blue',
} as const;

export type ButtonVariant = (typeof ButtonVariants)[keyof typeof ButtonVariants];

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
  variant: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  green: 'bg-[#7b9d25] hover:bg-[#5b851e]',
  orange: 'bg-[#a54d34] hover:bg-[#6a3931]',
  blue: 'bg-[#25859d] hover:bg-[#25709d]',
};

export const Button = ({ className, variant, children, ...props }: ButtonProps) => {
  return (
    <button
      {...props}
      className={`${className} ${variantClasses[variant]} cursor-pointer rounded-2xl border-2 border-b-6 border-[#341d27] text-white active:border-b-2 active:translate-y-1 hover:shadow-md xl:text-8 min-w-30 md:max-w-70 md:min-w-36 md:text-2xl lg:min-w-50 lg:px-4 lg:py-1 lg:text-3xl xl:min-w-62 xl:py-2 2xl:min-w-70 px-2 py-0 min-h-15 text-lg font-black w-full transition-colors duration-150`}
    >
      {children}
    </button>
  );
};
