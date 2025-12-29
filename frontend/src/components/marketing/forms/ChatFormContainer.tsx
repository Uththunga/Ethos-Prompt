/**
 * ChatFormContainer
 * Wrapper component for embedding forms within chat messages
 * Provides consistent styling, animations, and accessibility
 */

import React from 'react';
import './ChatForms.css';

export interface ChatFormContainerProps {
  title: string;
  icon: string;
  onClose: () => void;
  children: React.ReactNode;
  currentStep?: number;
  totalSteps?: number;
}

export const ChatFormContainer: React.FC<ChatFormContainerProps> = ({
  title,
  icon,
  onClose,
  children,
  currentStep,
  totalSteps,
}) => {
  // Handle keyboard navigation for close button
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="chat-form-container"
      role="region"
      aria-labelledby="chat-form-title"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      {/* Header */}
      <div className="chat-form-header">
        <h3 id="chat-form-title">
          <span className="chat-form-header-icon" aria-hidden="true">
            {icon}
          </span>
          {title}
        </h3>
        <button
          type="button"
          className="chat-form-close-btn"
          onClick={onClose}
          aria-label="Close form"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
          >
            <path d="M4 4L12 12M12 4L4 12" />
          </svg>
        </button>
      </div>

      {/* Step Progress (for multi-step forms) */}
      {totalSteps && totalSteps > 1 && currentStep && (
        <div className="chat-form-steps" role="progressbar" aria-valuenow={currentStep} aria-valuemin={1} aria-valuemax={totalSteps}>
          {Array.from({ length: totalSteps }, (_, i) => {
            const stepNum = i + 1;
            const isCompleted = stepNum < currentStep;
            const isActive = stepNum === currentStep;

            return (
              <React.Fragment key={stepNum}>
                {i > 0 && (
                  <div
                    className={`chat-form-step-connector ${isCompleted ? 'completed' : ''}`}
                    aria-hidden="true"
                  />
                )}
                <div
                  className={`chat-form-step ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${!isActive && !isCompleted ? 'inactive' : ''}`}
                  aria-current={isActive ? 'step' : undefined}
                >
                  {isCompleted ? '✓' : stepNum}
                </div>
              </React.Fragment>
            );
          })}
        </div>
      )}

      {/* Form Content */}
      <div className="chat-form-content">{children}</div>
    </div>
  );
};

export default ChatFormContainer;
