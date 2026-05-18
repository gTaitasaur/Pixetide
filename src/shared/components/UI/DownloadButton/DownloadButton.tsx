import React from 'react';
import { Button, ButtonVariant } from '../Button/Button';

interface DownloadButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
  fullWidth?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  children,
  variant = 'primary',
  ...props
}) => {
  const downloadIcon = (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" width="20" height="20">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4V4" />
    </svg>
  );

  return (
    <Button variant={variant} icon={downloadIcon} {...props}>
      {children}
    </Button>
  );
};
