import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';

export const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="w-full bg-white" role="main" id="main-content">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold font-poppins leading-tight tracking-tight mb-6">
              <span className="bg-gradient-to-r from-ethos-navy-light to-ethos-gray-light bg-clip-text text-transparent">
                Terms of Service
              </span>
            </h1>
            <p className="text-ethos-gray text-body-large leading-relaxed">
              Last updated:{' '}
              {new Date().toLocaleDateString('en-AU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </header>

          {/* Content */}
          <div className="prose prose-lg max-w-none">
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Agreement to Terms
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                These Terms of Service ("Terms") govern your use of EthosPrompt's website, services,
                and AI solutions ("Services"). By accessing or using our Services, you agree to be
                bound by these Terms and our Privacy Policy.
              </p>
              <p className="text-ethos-gray leading-relaxed">
                These Terms are governed by Australian law, including the Australian Consumer Law
                (ACL) under the Competition and Consumer Act 2010 (Cth). If you do not agree to
                these Terms, please do not use our Services.
              </p>
            </section>

            {/* Services Description */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Our Services
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                EthosPrompt provides enterprise AI solutions including:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray">
                <li className="mb-2">
                  Custom AI Solutions for customer support and sales optimization
                </li>
                <li className="mb-2">Custom web and mobile application development</li>
                <li className="mb-2">AI chatbots and business automation</li>
                <li className="mb-2">System Integration and Automation services</li>
                <li className="mb-2 last:mb-0">AI prompt engineering and optimization</li>
              </ul>
            </section>

            {/* User Responsibilities */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Your Responsibilities
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                When using our Services, you agree to:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">Provide accurate and complete information</li>
                <li className="mb-2">Use our Services only for lawful business purposes</li>
                <li className="mb-2">Comply with all applicable laws and regulations</li>
                <li className="mb-2">
                  Protect your account credentials and notify us of unauthorized access
                </li>
                <li className="mb-2 last:mb-0">Respect intellectual property rights</li>
                <li>Not interfere with or disrupt our Services</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                You are responsible for all activities that occur under your account and for
                ensuring your use complies with these Terms.
              </p>
            </section>

            {/* Payment Terms */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Payment and Billing
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                Payment terms for our Services:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">
                  Fees are quoted in Australian Dollars (AUD) unless otherwise specified
                </li>
                <li className="mb-2">
                  Payment is due within 30 days of invoice date unless otherwise agreed
                </li>
                <li className="mb-2">
                  Late payment may incur interest charges at the rate of 1.5% per month
                </li>
                <li className="mb-2">
                  All fees are exclusive of GST, which will be added where applicable
                </li>
                <li className="mb-2 last:mb-0">
                  Refunds are subject to our refund policy and Australian Consumer Law
                </li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                We reserve the right to suspend Services for overdue accounts after providing
                reasonable notice.
              </p>
            </section>

            {/* Intellectual Property */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Intellectual Property
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                Our Services and all related intellectual property remain our property or that of
                our licensors. This includes:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">Software, algorithms, and AI models</li>
                <li className="mb-2">Documentation, guides, and training materials</li>
                <li className="mb-2">Trademarks, logos, and branding</li>
                <li className="mb-2 last:mb-0">Website content and design</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                You retain ownership of your data and content. By using our Services, you grant us a
                limited license to use your data solely to provide the Services.
              </p>
            </section>

            {/* Service Availability */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Service Availability and Support
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We strive to provide reliable Services but cannot guarantee uninterrupted
                availability. We may:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">Perform scheduled maintenance with reasonable notice</li>
                <li className="mb-2">
                  Temporarily suspend Services for security or technical reasons
                </li>
                <li className="mb-2 last:mb-0">
                  Update or modify Services to improve functionality
                </li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                Support is provided during Australian business hours (AEST/AEDT) unless otherwise
                agreed in your service agreement.
              </p>
            </section>

            {/* Limitation of Liability */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Limitation of Liability
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                To the extent permitted by Australian law, including the Australian Consumer Law:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">
                  Our liability is limited to the amount paid for the specific Service
                </li>
                <li className="mb-2">
                  We exclude liability for indirect, consequential, or special damages
                </li>
                <li className="mb-2">
                  We do not warrant that Services will meet all your requirements
                </li>
                <li className="mb-2 last:mb-0">You use our Services at your own risk</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                Nothing in these Terms excludes, restricts, or modifies any consumer guarantees or
                rights under Australian Consumer Law that cannot be excluded.
              </p>
            </section>

            {/* Australian Consumer Law */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Australian Consumer Law Rights
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                If you are a consumer under Australian Consumer Law, you have certain rights that
                cannot be excluded, including:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">Services must be provided with due care and skill</li>
                <li className="mb-2">Services must be fit for purpose and reasonably suitable</li>
                <li className="mb-2">
                  Right to refund, replacement, or compensation for major failures
                </li>
                <li className="mb-2 last:mb-0">
                  Right to cancel contracts in certain circumstances
                </li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                If our Services fail to meet consumer guarantees, you may be entitled to remedies
                under Australian Consumer Law.
              </p>
            </section>

            {/* Privacy and Data */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Privacy and Data Protection
              </h2>
              <p className="text-ethos-gray leading-relaxed">
                We collect and handle personal information in accordance with our Privacy Policy and
                Australian privacy laws. By using our Services, you consent to our collection and
                use of information as described in our Privacy Policy.
              </p>
            </section>

            {/* Termination */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">Termination</h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                Either party may terminate these Terms:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">With 30 days' written notice for convenience</li>
                <li className="mb-2">
                  Immediately for material breach that remains uncured after 14 days' notice
                </li>
                <li className="mb-2 last:mb-0">Immediately for insolvency or similar events</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                Upon termination, you must cease using our Services and we will provide reasonable
                assistance for data retrieval subject to our data retention policies.
              </p>
            </section>

            {/* Governing Law */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Governing Law and Disputes
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                These Terms are governed by the laws of New South Wales, Australia. Any disputes
                will be subject to the exclusive jurisdiction of the courts of New South Wales.
              </p>
              <p className="text-ethos-gray leading-relaxed">
                We encourage resolving disputes through direct communication. If needed, we support
                alternative dispute resolution methods before litigation.
              </p>
            </section>

            {/* Changes to Terms */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Changes to Terms
              </h2>
              <p className="text-ethos-gray leading-relaxed">
                We may update these Terms from time to time. We will notify you of material changes
                by email or through our website. Continued use of our Services after changes
                constitutes acceptance of the updated Terms.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Contact Information
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                For questions about these Terms, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-ethos-gray mb-2">
                  <strong>Email:</strong> legal@ethosprompt.com
                </p>
                <p className="text-ethos-gray mb-2">
                  <strong>Phone:</strong> +61 (0) 123 456 789
                </p>
                <p className="text-ethos-gray">
                  <strong>Address:</strong> 123 AI Street, Tech Valley, Sydney NSW 2000
                </p>
              </div>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default TermsOfService;
