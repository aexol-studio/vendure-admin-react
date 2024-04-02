import * as React from 'react';

import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(({ className, type, ...props }, ref) => {
  const inputClassName = cn(
    'flex h-10 w-full max-w-sm rounded-md border border-stone-200 bg-white px-3 py-2 text-sm flex file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-stone-500 focus-visible:outline-none focus-visible:border-stone-950 dark:focus-visible:border-stone-500  disabled:cursor-not-allowed disabled:opacity-50 dark:border-stone-800 dark:bg-stone-950 dark:placeholder:text-stone-400',
    className,
  );
  if (props.label) {
    return (
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="email">{props.label}</Label>
        <input type={type} className={inputClassName} ref={ref} {...props} />
      </div>
    );
  }
  return <input type={type} className={inputClassName} ref={ref} {...props} />;
});
Input.displayName = 'Input';

export { Input };
