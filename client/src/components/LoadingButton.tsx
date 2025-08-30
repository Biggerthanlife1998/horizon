import { ReactNode } from 'react';

interface LoadingButtonProps {
  loading: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
  className?: string;
  children: ReactNode;
  loadingText?: string;
}

export default function LoadingButton({
  loading,
  disabled = false,
  onClick,
  type = 'button',
  className = 'btn-primary',
  children,
  loadingText
}: LoadingButtonProps) {
  return (
    <button
      type={type}
      disabled={loading || disabled}
      onClick={onClick}
      className={`w-full ${className} disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
    >
      {loading ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          {loadingText || 'Loading...'}
        </>
      ) : (
        children
      )}
    </button>
  );
}








