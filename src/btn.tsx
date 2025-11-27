import React from 'react';
import { FaSpinner } from 'react-icons/fa6';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    loadingIcon?: React.ReactNode;
    className?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    loading = false,
    loadingIcon,
    className = '',
    disabled,
    ...props
}) => {
    return (
        <button
            className={`inline-flex items-center justify-center px-4 py-2 rounded-full bg-btn text-base font-medium shadow-sm outline-none! cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className="mr-2 text-2xl animate-spin">
                    {loadingIcon || <FaSpinner />}
                </span>
            )}
            {children}
        </button>
    );
};
