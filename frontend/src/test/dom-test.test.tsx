import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

// Simple component to test DOM environment
const TestComponent = () => {
  return <div data-testid="test-component">Hello World</div>;
};

describe('DOM Environment Test', () => {
  it('should have access to document', () => {
    expect(document).toBeDefined();
    expect(document.body).toBeDefined();
  });

  it('should render a simple component', () => {
    render(<TestComponent />);
    expect(screen.getByTestId('test-component')).toBeDefined();
    expect(screen.getByText('Hello World')).toBeDefined();
  });
});
