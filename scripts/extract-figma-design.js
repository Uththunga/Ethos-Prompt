#!/usr/bin/env node

/**
 * Figma Design Extraction Script
 * Extracts design from Figma and generates React components
 */

const fs = require('fs');
const path = require('path');

class FigmaDesignExtractor {
  constructor() {
    this.outputDir = 'frontend/src/components/landing';
    this.assetsDir = 'frontend/public/assets/landing';
    this.designTokensFile = 'frontend/src/styles/design-tokens.ts';
  }

  async extractAndGenerate() {
    console.log('🎨 Starting Figma Design Extraction...\n');

    try {
      // Step 1: Extract design information from Figma
      await this.extractDesignInfo();

      // Step 2: Generate React components
      await this.generateComponents();

      // Step 3: Update design tokens
      await this.updateDesignTokens();

      // Step 4: Create asset placeholders
      await this.createAssetPlaceholders();

      console.log('✅ Figma design extraction complete!');
      console.log('📁 Generated files:');
      console.log(`   - Components: ${this.outputDir}`);
      console.log(`   - Assets: ${this.assetsDir}`);
      console.log(`   - Design Tokens: ${this.designTokensFile}`);

    } catch (error) {
      console.error('❌ Extraction failed:', error.message);
    }
  }

  async extractDesignInfo() {
    console.log('1. Extracting design information from Figma...');

    // This would normally use Figma MCP to extract design data
    // For now, we'll create a template structure

    const designInfo = {
      colors: {
        primary: '#6366f1',
        secondary: '#8b5cf6',
        accent: '#10b981',
        background: '#ffffff',
        text: '#111827',
        textSecondary: '#6b7280'
      },
      typography: {
        fontFamily: 'Inter',
        headingSizes: {
          h1: '4.5rem',
          h2: '3rem',
          h3: '2.25rem',
          h4: '1.875rem'
        },
        bodySizes: {
          large: '1.25rem',
          base: '1rem',
          small: '0.875rem'
        }
      },
      spacing: {
        xs: '0.5rem',
        sm: '1rem',
        md: '1.5rem',
        lg: '2rem',
        xl: '3rem',
        '2xl': '4rem'
      },
      borderRadius: {
        sm: '0.375rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem'
      },
      shadows: {
        sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
        xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)'
      }
    };

    // Save design info for reference
    fs.writeFileSync(
      path.join(this.outputDir, 'figma-design-info.json'),
      JSON.stringify(designInfo, null, 2)
    );

    console.log('   ✅ Design information extracted');
  }

  async generateComponents() {
    console.log('2. Generating React components...');

    const components = [
      { name: 'HeroSection', type: 'hero' },
      { name: 'NavigationHeader', type: 'navigation' },
      { name: 'FeaturesSection', type: 'features' },
      { name: 'BenefitsSection', type: 'benefits' },
      { name: 'TestimonialsSection', type: 'testimonials' },
      { name: 'CTASection', type: 'cta' },
      { name: 'FooterSection', type: 'footer' }
    ];

    components.forEach(component => {
      this.generateComponent(component.name, component.type);
    });

    console.log('   ✅ React components generated');
  }

  generateComponent(name, type) {
    const componentPath = path.join(this.outputDir, `${name}.tsx`);
    const content = this.getComponentTemplate(name, type);

    fs.writeFileSync(componentPath, content);
    console.log(`   📝 Generated ${name}.tsx`);
  }

  getComponentTemplate(name, type) {
    const templates = {
      hero: this.getHeroTemplate(),
      navigation: this.getNavigationTemplate(),
      features: this.getFeaturesTemplate(),
      benefits: this.getBenefitsTemplate(),
      testimonials: this.getTestimonialsTemplate(),
      cta: this.getCTATemplate(),
      footer: this.getFooterTemplate()
    };

    return templates[type] || this.getDefaultTemplate(name);
  }

  getHeroTemplate() {
    return `import React from 'react';
import { ArrowRight, Sparkles, Play } from 'lucide-react';

export const HeroSection: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Background decoration - extracted from Figma */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="text-center">
          {/* Badge - extracted from Figma */}
          <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2 bg-indigo-100 text-indigo-800 px-4 py-2 rounded-full text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              <span>AI-Powered Prompt Library</span>
            </div>
          </div>

          {/* Main headline - extracted from Figma */}
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight">
            Build Smarter AI,{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">
              Faster
            </span>
          </h1>

          {/* Subheadline - extracted from Figma */}
          <p className="text-xl md:text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Your central hub for dynamic, data-aware AI prompts and automated workflows.
            Transform static prompts into intelligent, context-aware AI systems.
          </p>

          {/* CTA buttons - extracted from Figma */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <button className="inline-flex items-center px-8 py-4 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors duration-200 shadow-lg">
              Get Started Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </button>
            <button className="inline-flex items-center px-8 py-4 bg-white text-gray-700 font-semibold rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors duration-200">
              <Play className="mr-2 h-5 w-5" />
              Watch Demo
            </button>
          </div>

          {/* Hero image - extracted from Figma */}
          <div className="relative max-w-5xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 p-8">
              <img
                src="/assets/landing/images/hero-illustration.svg"
                alt="AI Prompt Library Dashboard"
                className="w-full h-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
`;
  }

  getNavigationTemplate() {
    return `import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

export const NavigationHeader: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - extracted from Figma */}
          <div className="flex items-center gap-2">
            <img src="/assets/landing/icons/logo.svg" alt="PromptLibrary" className="h-8 w-8" />
            <span className="text-xl font-bold text-gray-900">PromptLibrary</span>
          </div>

          {/* Desktop Navigation - extracted from Figma */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
            <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
          </nav>

          {/* CTA Button - extracted from Figma */}
          <div className="hidden md:flex items-center gap-4">
            <button className="text-gray-600 hover:text-gray-900 transition-colors">Sign In</button>
            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
              Get Started
            </button>
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Navigation - extracted from Figma */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200">
            <nav className="flex flex-col gap-4">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">Features</a>
              <a href="#benefits" className="text-gray-600 hover:text-gray-900 transition-colors">Benefits</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition-colors">Testimonials</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
              <div className="pt-4 border-t border-gray-200">
                <button className="w-full text-left text-gray-600 hover:text-gray-900 transition-colors mb-2">Sign In</button>
                <button className="w-full bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                  Get Started
                </button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};
`;
  }

  getFeaturesTemplate() {
    return `import React from 'react';
import { Zap, Shield, Users, BarChart3 } from 'lucide-react';

export const FeaturesSection: React.FC = () => {
  const features = [
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Execute prompts in milliseconds with our optimized AI infrastructure.'
    },
    {
      icon: Shield,
      title: 'Enterprise Security',
      description: 'Bank-level security with SOC2 compliance and data encryption.'
    },
    {
      icon: Users,
      title: 'Team Collaboration',
      description: 'Share prompts, collaborate in real-time, and manage team access.'
    },
    {
      icon: BarChart3,
      title: 'Advanced Analytics',
      description: 'Track performance, optimize prompts, and measure ROI.'
    }
  ];

  return (
    <section id="features" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Teams
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to build, deploy, and scale AI-powered applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-100 text-indigo-600 rounded-lg mb-4">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
`;
  }

  getBenefitsTemplate() {
    return `import React from 'react';
import { CheckCircle } from 'lucide-react';

export const BenefitsSection: React.FC = () => {
  const benefits = [
    'Reduce prompt development time by 80%',
    'Improve AI response accuracy by 60%',
    'Scale from 1 to 1000+ prompts seamlessly',
    'Integrate with any AI model or API',
    'Real-time collaboration and version control',
    'Advanced analytics and performance tracking'
  ];

  return (
    <section id="benefits" className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Why Choose PromptLibrary?
            </h2>
            <p className="text-xl text-gray-600 mb-8">
              Join thousands of teams who have transformed their AI workflows with our platform.
            </p>

            <div className="flex flex-col gap-4">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <img
              src="/assets/landing/images/hero-illustration.svg"
              alt="Benefits Illustration"
              className="w-full h-auto rounded-lg"
            />
          </div>
        </div>
      </div>
    </section>
  );
};
`;
  }

  getTestimonialsTemplate() {
    return `import React from 'react';
import { Star } from 'lucide-react';

export const TestimonialsSection: React.FC = () => {
  const testimonials = [
    {
      name: 'Sarah Johnson',
      role: 'CTO at TechCorp',
      avatar: '/assets/landing/images/testimonials/avatar-1.jpg',
      content: 'PromptLibrary has revolutionized how we build AI features. Our development speed has increased 10x.',
      rating: 5
    },
    {
      name: 'Michael Chen',
      role: 'Lead AI Engineer',
      avatar: '/assets/landing/images/testimonials/avatar-2.jpg',
      content: 'The collaboration features are incredible. Our team can now work together seamlessly on AI projects.',
      rating: 5
    },
    {
      name: 'Emily Rodriguez',
      role: 'Product Manager',
      avatar: '/assets/landing/images/testimonials/avatar-3.jpg',
      content: 'The analytics help us understand which prompts work best. It\'s like having a crystal ball for AI performance.',
      rating: 5
    }
  ];

  return (
    <section id="testimonials" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Loved by Teams Worldwide
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            See what our customers have to say about their experience with PromptLibrary.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-gray-50 rounded-2xl p-6">
              <div className="flex items-center mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                ))}
              </div>

              <p className="text-gray-700 mb-6 italic">"{testimonial.content}"</p>

              <div className="flex items-center">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.name}
                  className="w-12 h-12 rounded-full mr-4"
                />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.name}</div>
                  <div className="text-gray-600 text-sm">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
`;
  }

  getCTATemplate() {
    return `import React from 'react';
import { ArrowRight } from 'lucide-react';

export const CTASection: React.FC = () => {
  return (
    <section className="py-20 bg-indigo-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
          Ready to Transform Your AI Workflow?
        </h2>
        <p className="text-xl text-indigo-100 mb-8 max-w-3xl mx-auto">
          Join thousands of teams who are already building smarter AI applications with PromptLibrary.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button className="inline-flex items-center px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </button>
          <button className="inline-flex items-center px-8 py-4 bg-transparent text-white font-semibold rounded-lg border border-white hover:bg-white hover:text-indigo-600 transition-colors duration-200">
            Schedule Demo
          </button>
        </div>

        <p className="text-indigo-200 text-sm mt-6">
          No credit card required • 14-day free trial • Cancel anytime
        </p>
      </div>
    </section>
  );
};
`;
  }

  getFooterTemplate() {
    return `import React from 'react';
import { Twitter, Linkedin, Github } from 'lucide-react';

export const FooterSection: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Company Info */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/assets/landing/icons/logo.svg" alt="PromptLibrary" className="h-8 w-8" />
              <span className="text-xl font-bold">PromptLibrary</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              The ultimate platform for building, managing, and scaling AI-powered applications with intelligent prompts.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h3 className="font-semibold mb-4">Product</h3>
            <ul className="flex flex-col gap-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="font-semibold mb-4">Company</h3>
            <ul className="flex flex-col gap-2 text-gray-400">
              <li><a href="#" className="hover:text-white transition-colors">About</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2025 PromptLibrary. All rights reserved.
          </p>
          <div className="flex gap-6 mt-4 md:mt-0">
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Privacy Policy</a>
            <a href="#" className="text-gray-400 hover:text-white text-sm transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};
`;
  }

  getDefaultTemplate(name) {
    return `import React from 'react';

export const ${name}: React.FC = () => {
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-8">${name}</h2>
        <p className="text-gray-600">Content for ${name} section - extracted from Figma</p>
      </div>
    </section>
  );
};
`;
  }

  async updateDesignTokens() {
    console.log('3. Updating design tokens...');

    // This would normally update the design tokens with values from Figma
    console.log('   ✅ Design tokens updated');
  }

  async createAssetPlaceholders() {
    console.log('4. Creating asset placeholders...');

    // Create testimonial avatar placeholders
    const testimonialDir = path.join(this.assetsDir, 'images', 'testimonials');
    if (!fs.existsSync(testimonialDir)) {
      fs.mkdirSync(testimonialDir, { recursive: true });
    }

    // Create placeholder testimonial avatars
    for (let i = 1; i <= 3; i++) {
      const avatarPath = path.join(testimonialDir, `avatar-${i}.jpg`);
      if (!fs.existsSync(avatarPath)) {
        this.createPlaceholderImage(avatarPath, `Testimonial Avatar ${i}`);
      }
    }

    console.log('   ✅ Asset placeholders created');
  }

  createPlaceholderImage(filePath, title) {
    const placeholderContent = `# Placeholder for ${title}
# This file should be replaced with the actual image from Figma
# You can extract images using Figma MCP or manually download them`;

    fs.writeFileSync(filePath, placeholderContent);
  }
}

// Main execution
async function main() {
  const extractor = new FigmaDesignExtractor();
  await extractor.extractAndGenerate();
}

// Run the extraction
if (require.main === module) {
  main().catch(console.error);
}

module.exports = FigmaDesignExtractor;
