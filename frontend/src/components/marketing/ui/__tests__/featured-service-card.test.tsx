import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect } from 'vitest';
import { FeaturedServiceCard } from '../featured-service-card';

// Wrapper component to provide Router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('FeaturedServiceCard', () => {
  const defaultProps = {
    title: 'Smart Business Assistant',
    description: '24/7 AI-powered support that handles customer service, sales, and operations.',
    benefits: [
      'Reduce customer service costs by 87%',
      'Answer customer questions in under 30 seconds',
      'Handle 80% of inquiries automatically',
      'Live in 30 days with full support',
    ],
    stats: [
      { label: 'Cost Reduction', value: '87%' },
      { label: 'Response Time', value: '<30s' },
      { label: 'Automation Rate', value: '80%' },
      { label: 'Customer Satisfaction', value: '95%' },
    ],
    startingPrice: '$890',
    currency: 'AUD',
    ctaText: 'Calculate Your Savings',
    ctaLink: '/services/smart-assistant#roi-calculator',
  };

  it('renders the component with all required props', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check title is rendered
    expect(screen.getByText('Smart Business Assistant')).toBeInTheDocument();

    // Check description is rendered
    expect(screen.getByText(/24\/7 AI-powered support/i)).toBeInTheDocument();

    // Check CTA button is rendered
    expect(screen.getByRole('link', { name: /Calculate Your Savings/i })).toBeInTheDocument();
  });

  it('displays all benefits with checkmarks', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check all benefits are rendered
    expect(screen.getByText(/Reduce customer service costs by 87%/i)).toBeInTheDocument();
    expect(screen.getByText(/Answer customer questions in under 30 seconds/i)).toBeInTheDocument();
    expect(screen.getByText(/Handle 80% of inquiries automatically/i)).toBeInTheDocument();
    expect(screen.getByText(/Live in 30 days with full support/i)).toBeInTheDocument();
  });

  it('displays all statistics correctly', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check all stat values are rendered
    expect(screen.getByText('87%')).toBeInTheDocument();
    expect(screen.getByText('<30s')).toBeInTheDocument();
    expect(screen.getByText('80%')).toBeInTheDocument();
    expect(screen.getByText('95%')).toBeInTheDocument();

    // Check all stat labels are rendered
    expect(screen.getByText('Cost Reduction')).toBeInTheDocument();
    expect(screen.getByText('Response Time')).toBeInTheDocument();
    expect(screen.getByText('Automation Rate')).toBeInTheDocument();
    expect(screen.getByText('Customer Satisfaction')).toBeInTheDocument();
  });

  it('displays pricing information correctly', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check pricing elements
    expect(screen.getByText('Starting from')).toBeInTheDocument();
    expect(screen.getByText('$890')).toBeInTheDocument();
    expect(screen.getByText('/month AUD')).toBeInTheDocument();
    expect(screen.getByText('+ GST')).toBeInTheDocument();
  });

  it('displays default badge when no badge prop provided', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    expect(screen.getByText('Most Popular')).toBeInTheDocument();
  });

  it('displays custom badge when provided', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} badge="⭐ Recommended" />
      </RouterWrapper>
    );

    expect(screen.getByText('⭐ Recommended')).toBeInTheDocument();
  });

  it('renders image when imageSrc is provided', () => {
    const propsWithImage = {
      ...defaultProps,
      imageSrc: '/assets/marketing/images/smart-assistant-dashboard.png',
    };

    render(
      <RouterWrapper>
        <FeaturedServiceCard {...propsWithImage} />
      </RouterWrapper>
    );

    const image = screen.getByAltText('Smart Business Assistant');
    expect(image).toBeInTheDocument();
    expect(image).toHaveAttribute('src', '/assets/marketing/images/smart-assistant-dashboard.png');
  });

  it('does not render image section when imageSrc is not provided', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    const image = screen.queryByAltText('Smart Business Assistant');
    expect(image).not.toBeInTheDocument();
  });

  it('CTA link has correct href', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    const ctaLink = screen.getByRole('link', { name: /Calculate Your Savings/i });
    expect(ctaLink).toHaveAttribute('href', '/services/smart-assistant#roi-calculator');
  });

  it('applies custom className when provided', () => {
    const { container } = render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} className="custom-test-class" />
      </RouterWrapper>
    );

    const card = container.querySelector('.custom-test-class');
    expect(card).toBeInTheDocument();
  });

  it('uses default currency when not provided', () => {
    const propsWithoutCurrency = { ...defaultProps };
    delete (propsWithoutCurrency as any).currency;

    render(
      <RouterWrapper>
        <FeaturedServiceCard {...propsWithoutCurrency} />
      </RouterWrapper>
    );

    expect(screen.getByText('/month AUD')).toBeInTheDocument();
  });

  it('uses custom currency when provided', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} currency="USD" />
      </RouterWrapper>
    );

    expect(screen.getByText('/month USD')).toBeInTheDocument();
  });

  it('renders stats with icons when provided', () => {
    const statsWithIcons = [
      {
        label: 'Cost Reduction',
        value: '87%',
        icon: <span data-testid="icon-cost">💰</span>,
      },
      {
        label: 'Response Time',
        value: '<30s',
        icon: <span data-testid="icon-time">⏱️</span>,
      },
    ];

    const propsWithIcons = {
      ...defaultProps,
      stats: statsWithIcons,
    };

    render(
      <RouterWrapper>
        <FeaturedServiceCard {...propsWithIcons} />
      </RouterWrapper>
    );

    expect(screen.getByTestId('icon-cost')).toBeInTheDocument();
    expect(screen.getByTestId('icon-time')).toBeInTheDocument();
  });

  it('is accessible with proper ARIA attributes', () => {
    render(
      <RouterWrapper>
        <FeaturedServiceCard {...defaultProps} />
      </RouterWrapper>
    );

    // Check that the CTA is a proper link
    const ctaLink = screen.getByRole('link', { name: /Calculate Your Savings/i });
    expect(ctaLink).toBeInTheDocument();

    // Check that image has alt text when present
    const propsWithImage = {
      ...defaultProps,
      imageSrc: '/test-image.png',
    };

    const { rerender } = render(
      <RouterWrapper>
        <FeaturedServiceCard {...propsWithImage} />
      </RouterWrapper>
    );

    const image = screen.getByAltText('Smart Business Assistant');
    expect(image).toBeInTheDocument();
  });
});

