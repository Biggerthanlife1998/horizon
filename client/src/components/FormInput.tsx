import { ReactNode } from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
  placeholder?: string;
  required?: boolean;
  icon?: ReactNode;
  className?: string;
  rows?: number;
  step?: string;
  min?: string;
  maxLength?: number;
  pattern?: string;
  accept?: string;
  children?: ReactNode; // For select options
}

export default function FormInput({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  icon,
  className = "",
  rows,
  step,
  min,
  maxLength,
  pattern,
  accept,
  children
}: FormInputProps) {
  const inputClasses = `input ${icon ? 'pl-10' : ''} ${className}`;

  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && '*'}
      </label>
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        {type === 'textarea' ? (
          <textarea
            id={name}
            name={name}
            rows={rows || 3}
            value={value}
            onChange={onChange}
            className={inputClasses}
            placeholder={placeholder}
            required={required}
            maxLength={maxLength}
          />
        ) : type === 'select' ? (
          <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className={inputClasses}
            required={required}
          >
            {children}
          </select>
        ) : (
          <input
            id={name}
            name={name}
            type={type}
            value={value}
            onChange={onChange}
            className={inputClasses}
            placeholder={placeholder}
            required={required}
            step={step}
            min={min}
            maxLength={maxLength}
            pattern={pattern}
            accept={accept}
          />
        )}
      </div>
    </div>
  );
}








