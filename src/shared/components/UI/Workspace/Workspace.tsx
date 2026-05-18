import React, { ReactNode } from 'react';
import './Workspace.css';

interface WorkspaceProps {
  children: ReactNode;
  className?: string;
}

export const Workspace: React.FC<WorkspaceProps> = ({ children, className = '' }) => {
  return (
    <div className={`tool-workspace-container fade-in ${className}`}>
      <div className="tool-workspace-content">
        {children}
      </div>
    </div>
  );
};
