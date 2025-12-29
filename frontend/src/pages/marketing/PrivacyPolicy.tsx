import React from 'react';
import { Navigation } from '@/components/marketing/layout/Navigation';
import { Footer } from '@/components/marketing/layout/Footer';

export const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <main className="w-full bg-white" role="main" id="main-content">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20 lg:py-24">
          {/* Header */}
          <header className="mb-12">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold font-poppins leading-tight tracking-tight mb-6">
              <span className="bg-gradient-to-r from-ethos-navy-light to-ethos-gray-light bg-clip-text text-transparent">
                Privacy Policy
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
                Introduction
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                EthosPrompt ("we", "our", or "us") is committed to protecting your privacy and
                personal information. This Privacy Policy explains how we collect, use, disclose,
                and safeguard your personal information in accordance with the Australian Privacy
                Act 1988 (Cth) and the Australian Privacy Principles (APPs).
              </p>
              <p className="text-ethos-gray leading-relaxed">
                This policy applies to all personal information we collect through our website,
                services, and interactions with you. By using our services, you consent to the
                collection and use of your personal information as described in this policy.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Information We Collect
              </h2>

              <h3 className="heading-subsection font-medium text-ethos-purple mb-3">
                Personal Information
              </h3>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We may collect the following types of personal information:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-6">
                <li className="mb-2">
                  Contact information (name, email address, phone number, business address)
                </li>
                <li className="mb-2">Business information (company name, job title, industry)</li>
                <li className="mb-2">Communication records (emails, chat logs, support tickets)</li>
                <li className="mb-2">
                  Technical information (IP address, browser type, device information)
                </li>
                <li className="mb-2 last:mb-0">
                  Usage data (pages visited, time spent, features used)
                </li>
                <li>Payment information (processed securely through third-party providers)</li>
              </ul>

              <h3 className="heading-subsection font-medium text-ethos-purple mb-3">
                How We Collect Information
              </h3>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We collect personal information through:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray">
                <li className="mb-2">Direct interactions (forms, emails, phone calls, meetings)</li>
                <li className="mb-2">Website usage (cookies, analytics, tracking technologies)</li>
                <li className="mb-2">Third-party sources (business partners, public databases)</li>
                <li className="mb-2 last:mb-0">
                  Service delivery (AI solutions, system integrations)
                </li>
              </ul>
            </section>

            {/* How We Use Information */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                How We Use Your Information
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We use your personal information for the following purposes:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray">
                <li className="mb-2">Providing and delivering our AI solutions and services</li>
                <li className="mb-2">Communicating with you about our services and support</li>
                <li className="mb-2">Processing payments and managing accounts</li>
                <li className="mb-2">Improving our services and developing new features</li>
                <li className="mb-2">Marketing and promotional activities (with your consent)</li>
                <li className="mb-2 last:mb-0">
                  Complying with legal obligations and regulatory requirements
                </li>
                <li>Protecting our business interests and preventing fraud</li>
              </ul>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Information Sharing and Disclosure
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We may share your personal information with:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">
                  Service providers and contractors who assist in delivering our services
                </li>
                <li className="mb-2">
                  Technology partners for AI platform integration and support
                </li>
                <li className="mb-2">Payment processors for transaction processing</li>
                <li className="mb-2">Legal and professional advisors when required</li>
                <li className="mb-2 last:mb-0">Government agencies when legally required</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                We do not sell, rent, or trade your personal information to third parties for
                marketing purposes without your explicit consent.
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Data Security
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                We implement appropriate technical and organisational measures to protect your
                personal information, including:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray">
                <li className="mb-2">Encryption of data in transit and at rest</li>
                <li className="mb-2">Access controls and authentication systems</li>
                <li className="mb-2">Regular security assessments and updates</li>
                <li className="mb-2">Staff training on privacy and security practices</li>
                <li className="mb-2 last:mb-0">
                  Incident response and breach notification procedures
                </li>
              </ul>
            </section>

            {/* Your Rights */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Your Privacy Rights
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                Under Australian privacy law, you have the right to:
              </p>
              <ul className="list-disc pl-6 text-ethos-gray mb-4">
                <li className="mb-2">Access your personal information we hold</li>
                <li className="mb-2">Request correction of inaccurate or incomplete information</li>
                <li className="mb-2">
                  Request deletion of your personal information (subject to legal requirements)
                </li>
                <li className="mb-2">Withdraw consent for marketing communications</li>
                <li className="mb-2 last:mb-0">Lodge a complaint about our privacy practices</li>
              </ul>
              <p className="text-ethos-gray leading-relaxed">
                To exercise these rights, please contact us using the details provided below.
              </p>
            </section>

            {/* Data Retention */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Data Retention
              </h2>
              <p className="text-ethos-gray leading-relaxed">
                We retain your personal information for as long as necessary to fulfill the purposes
                outlined in this policy, comply with legal obligations, resolve disputes, and
                enforce our agreements. When personal information is no longer required, we securely
                delete or anonymise it.
              </p>
            </section>

            {/* International Transfers */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                International Data Transfers
              </h2>
              <p className="text-ethos-gray leading-relaxed">
                Some of our service providers may be located overseas. When we transfer personal
                information internationally, we ensure appropriate safeguards are in place to
                protect your information in accordance with Australian privacy law.
              </p>
            </section>

            {/* Updates */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Policy Updates
              </h2>
              <p className="text-ethos-gray leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any
                material changes by posting the updated policy on our website and updating the "Last
                updated" date. Your continued use of our services after such changes constitutes
                acceptance of the updated policy.
              </p>
            </section>

            {/* Contact Information */}
            <section className="mb-8">
              <h2 className="text-h2 text-ethos-navy mb-6">
                Contact Us
              </h2>
              <p className="text-ethos-gray leading-relaxed mb-4">
                If you have any questions about this Privacy Policy or wish to exercise your privacy
                rights, please contact us:
              </p>
              <div className="bg-gray-50 p-6 rounded-lg">
                <p className="text-ethos-gray mb-2">
                  <strong>Email:</strong> privacy@ethosprompt.com
                </p>
                <p className="text-ethos-gray mb-2">
                  <strong>Phone:</strong> +61 (0) 123 456 789
                </p>
                <p className="text-ethos-gray mb-4">
                  <strong>Address:</strong> 123 AI Street, Tech Valley, Sydney NSW 2000
                </p>
                <p className="text-ethos-gray text-body-small">
                  If you are not satisfied with our response to your privacy concern, you may lodge
                  a complaint with the Office of the Australian Information Commissioner (OAIC) at
                  <a href="https://www.oaic.gov.au" className="text-ethos-purple hover:underline">
                    www.oaic.gov.au
                  </a>
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

export default PrivacyPolicy;
