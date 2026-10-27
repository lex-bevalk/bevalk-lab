import type { SelectHTMLAttributes } from 'react';
import { ChevronDown } from 'lucide-react';
import './select.css';

interface NativeSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
}

export default function NativeSelect({ wrapperClassName, className, children, ...props }: NativeSelectProps) {
  return (
    <span className={['comments-select', wrapperClassName].filter(Boolean).join(' ')}>
      <select {...props} className={['odin-select__trigger', className].filter(Boolean).join(' ')}>
        {children}
      </select>
      <ChevronDown className="odin-select__chev" size={16} aria-hidden="true" />
    </span>
  );
}
