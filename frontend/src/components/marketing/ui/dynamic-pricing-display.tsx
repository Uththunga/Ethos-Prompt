import { Button } from '@/components/marketing/ui/button';
import { Card } from '@/components/marketing/ui/card';
import { Calculator } from 'lucide-react';
import React, { useEffect, useMemo, useState } from 'react';

interface PricingTier {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  features: string[];
  recommended?: boolean;
  maxUsers?: number;
  maxTransactions?: number;
}

interface PricingModifier {
  id: string;
  name: string;
  type: 'multiplier' | 'addition' | 'percentage';
  value: number;
  condition: (inputs: PricingInputs) => boolean;
  description: string;
}

interface PricingInputs {
  users: number;
  transactions: number;
  integrations: number;
  supportLevel: 'basic' | 'premium' | 'enterprise';
  billingCycle: 'monthly' | 'annual';
  industry: string;
}

interface DynamicPricingDisplayProps {
  service: string;
  tiers: PricingTier[];
  modifiers?: PricingModifier[];
  showCalculator?: boolean;
  onPriceCalculated?: (price: number, tier: PricingTier, inputs: PricingInputs) => void;
  className?: string;
}

const defaultModifiers: PricingModifier[] = [
  {
    id: 'annual-discount',
    name: 'Annual Billing Discount',
    type: 'percentage',
    value: -20,
    condition: (inputs) => inputs.billingCycle === 'annual',
    description: '20% discount for annual billing'
  },
  {
    id: 'enterprise-support',
    name: 'Enterprise Support',
    type: 'addition',
    value: 500,
    condition: (inputs) => inputs.supportLevel === 'enterprise',
    description: 'Dedicated support team'
  },
  {
    id: 'high-volume-discount',
    name: 'High Volume Discount',
    type: 'percentage',
    value: -15,
    condition: (inputs) => inputs.users > 100,
    description: '15% discount for 100+ users'
  },
  {
    id: 'integration-fee',
    name: 'Additional Integrations',
    type: 'addition',
    value: 100,
    condition: (inputs) => inputs.integrations > 5,
    description: '$100 per integration beyond 5'
  }
];

export const DynamicPricingDisplay: React.FC<DynamicPricingDisplayProps> = ({
  tiers,
  modifiers = defaultModifiers,
  showCalculator = true,
  onPriceCalculated,
  className = ""
}) => {
  const [inputs, setInputs] = useState<PricingInputs>({
    users: 10,
    transactions: 1000,
    integrations: 3,
    supportLevel: 'basic',
    billingCycle: 'monthly',
    industry: 'general'
  });

  const [selectedTier, setSelectedTier] = useState<string>(tiers[0]?.id || '');

  // Calculate dynamic pricing
  const calculatedPricing = useMemo(() => {
    const tier = tiers.find(t => t.id === selectedTier);
    if (!tier) return null;

    let finalPrice = tier.basePrice;
    const appliedModifiers: PricingModifier[] = [];

    // Apply modifiers
    modifiers.forEach(modifier => {
      if (modifier.condition(inputs)) {
        appliedModifiers.push(modifier);

        switch (modifier.type) {
          case 'multiplier':
            finalPrice *= modifier.value;
            break;
          case 'addition':
            finalPrice += modifier.value * (modifier.id === 'integration-fee' ? Math.max(0, inputs.integrations - 5) : 1);
            break;
          case 'percentage':
            finalPrice += (finalPrice * modifier.value / 100);
            break;
        }
      }
    });

    // User-based scaling
    if (tier.maxUsers && inputs.users > tier.maxUsers) {
      const extraUsers = inputs.users - tier.maxUsers;
      finalPrice += extraUsers * 10; // $10 per extra user
    }

    return {
      tier,
      basePrice: tier.basePrice,
      finalPrice: Math.max(0, finalPrice),
      appliedModifiers,
      savings: tier.basePrice - finalPrice
    };
  }, [selectedTier, inputs, tiers, modifiers]);

  useEffect(() => {
    if (calculatedPricing && onPriceCalculated) {
      onPriceCalculated(calculatedPricing.finalPrice, calculatedPricing.tier, inputs);
    }
  }, [calculatedPricing, inputs, onPriceCalculated]);

  const handleInputChange = (key: keyof PricingInputs, value: number | string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  return (
    <section className={`py-16 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Calculator className="w-8 h-8 text-ethos-purple mr-3" />
            <h2 className="text-3xl sm:text-4xl font-medium text-ethos-navy">
              Dynamic Pricing Calculator
            </h2>
          </div>
          <p className="text-xl text-ethos-gray max-w-3xl mx-auto">
            Get personalized pricing based on your specific needs and requirements
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calculator Inputs */}
          {showCalculator && (
            <Card className="p-6">
              <h3 className="text-xl font-semibold text-ethos-navy mb-6">
                Configure Your Requirements
              </h3>

              <div >
                {/* Users */}
                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    Number of Users
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="500"
                    value={inputs.users}
                    onChange={(e) => handleInputChange('users', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-2xl appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-ethos-gray mt-1">
                    <span>1</span>
                    <span className="font-medium text-ethos-purple">{inputs.users} users</span>
                    <span>500+</span>
                  </div>
                </div>

                {/* Transactions */}
                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    Monthly Transactions
                  </label>
                  <input
                    type="range"
                    min="100"
                    max="100000"
                    step="100"
                    value={inputs.transactions}
                    onChange={(e) => handleInputChange('transactions', parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-200 rounded-2xl appearance-none cursor-pointer slider"
                  />
                  <div className="flex justify-between text-sm text-ethos-gray mt-1">
                    <span>100</span>
                    <span className="font-medium text-ethos-purple">{inputs.transactions.toLocaleString()}</span>
                    <span>100K+</span>
                  </div>
                </div>

                {/* Integrations */}
                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    System Integrations
                  </label>
                  <select
                    value={inputs.integrations}
                    onChange={(e) => handleInputChange('integrations', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-2xl focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                      <option key={num} value={num}>{num} integration{num > 1 ? 's' : ''}</option>
                    ))}
                  </select>
                </div>

                {/* Support Level */}
                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    Support Level
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['basic', 'premium', 'enterprise'] as const).map(level => (
                      <button
                        key={level}
                        onClick={() => handleInputChange('supportLevel', level)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          inputs.supportLevel === level
                            ? 'bg-ethos-purple text-white'
                            : 'bg-gray-100 text-ethos-gray hover:bg-gray-200'
                        }`}
                      >
                        {level.charAt(0).toUpperCase() + level.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Billing Cycle */}
                <div>
                  <label className="block text-sm font-medium text-ethos-navy mb-2">
                    Billing Cycle
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['monthly', 'annual'] as const).map(cycle => (
                      <button
                        key={cycle}
                        onClick={() => handleInputChange('billingCycle', cycle)}
                        className={`px-3 py-2 text-sm font-medium rounded-lg transition-all ${
                          inputs.billingCycle === cycle
                            ? 'bg-ethos-purple text-white'
                            : 'bg-gray-100 text-ethos-gray hover:bg-gray-200'
                        }`}
                      >
                        {cycle.charAt(0).toUpperCase() + cycle.slice(1)}
                        {cycle === 'annual' && (
                          <span className="block text-xs text-green-200">Save 20%</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          )}

          {/* Pricing Display */}
          <Card className="p-6">
            <h3 className="text-xl font-semibold text-ethos-navy mb-6">
              Your Personalized Pricing
            </h3>

            {/* Tier Selection */}
            <div className="mb-6">
              {tiers.map(tier => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`w-full p-4 text-left rounded-2xl border-2 transition-all ${
                    selectedTier === tier.id
                      ? 'border-ethos-purple bg-ethos-purple/5'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-ethos-navy">{tier.name}</h4>
                      <p className="text-sm text-ethos-gray">{tier.description}</p>
                    </div>
                    {tier.recommended && (
                      <span className="px-2 py-1 text-xs font-medium bg-ethos-purple text-white rounded-full">
                        Recommended
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>

            {/* Price Calculation */}
            {calculatedPricing && (
              <div >
                <div className="bg-gradient-to-r from-ethos-purple/10 to-ethos-navy/10 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-ethos-gray">Base Price</span>
                    <span className="font-medium">{formatPrice(calculatedPricing.basePrice)}</span>
                  </div>

                  {calculatedPricing.appliedModifiers.map(modifier => (
                    <div key={modifier.id} className="flex items-center justify-between mb-2">
                      <span className="text-sm text-ethos-gray">{modifier.name}</span>
                      <span className={`font-medium ${modifier.value < 0 ? 'text-green-600' : 'text-ethos-navy'}`}>
                        {modifier.type === 'percentage' ? `${modifier.value}%` : formatPrice(modifier.value)}
                      </span>
                    </div>
                  ))}

                  <div className="border-t border-gray-200 pt-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-semibold text-ethos-navy">Total Price</span>
                      <span className="text-2xl font-bold text-ethos-purple">
                        {formatPrice(calculatedPricing.finalPrice)}
                        <span className="text-sm font-normal text-ethos-gray">
                          /{inputs.billingCycle === 'annual' ? 'year' : 'month'}
                        </span>
                      </span>
                    </div>
                    {calculatedPricing.savings > 0 && (
                      <div className="text-sm text-green-600 text-right">
                        You save {formatPrice(calculatedPricing.savings)}!
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="ethos" size="lg">
                  Get Started with {calculatedPricing.tier.name}
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </section>
  );
};
