import { InteractiveFAQ } from '@/components/marketing/ui/interactive-faq';
import React from 'react';

interface FAQ {
  id: string;
  question: string;
  answer: string;
  category: string;
  tags: string[];
}

export const ConsolidatedFAQ: React.FC = () => {
  const faqs: FAQ[] = [
    // Cost & Investment (Most important - put first)
    {
      id: '1',
      question: 'How much will this cost?',
      answer:
        "Simple WordPress migrations start at $7,997. Most businesses pay $19,997-$50,000 for a complete transformation. We'll give you an exact quote after a free assessment - no surprises, no hidden fees.",
      category: 'Cost & Investment',
      tags: ['cost', 'pricing', 'investment', 'budget', 'quote'],
    },
    {
      id: '2',
      question: 'Will I actually save money, or is this just an expensive upgrade?',
      answer:
        "You'll save real money. Most clients cut their monthly costs by 60% - that's $2,500+ saved every month on WordPress maintenance, plugins, and security patches. The average payback period is 12 months.",
      category: 'Cost & Investment',
      tags: ['savings', 'roi', 'payback', 'maintenance'],
    },
    {
      id: '3',
      question: 'Can I pay in instalments instead of all upfront?',
      answer:
        "Yes! We offer flexible payment plans including milestone-based payments (pay as we build) and monthly instalments. We'll work with your budget to make this affordable.",
      category: 'Cost & Investment',
      tags: ['payment', 'financing', 'instalments', 'budget'],
    },

    // Migration & Downtime (Biggest concern)
    {
      id: '4',
      question: 'Will my website go down during the migration?',
      answer:
        'No. We build your new site separately and switch over in minutes, usually during off-peak hours. Your current site stays live until the new one is ready. Zero downtime guaranteed.',
      category: 'Migration & Downtime',
      tags: ['downtime', 'migration', 'deployment', 'zero-downtime'],
    },
    {
      id: '5',
      question: 'What if something goes wrong during the migration?',
      answer:
        "We keep complete backups of everything and can roll back instantly if needed. In 5+ years, we've never had a failed migration. We also test everything thoroughly before going live.",
      category: 'Migration & Downtime',
      tags: ['backup', 'safety', 'rollback', 'risk'],
    },
    {
      id: '6',
      question: 'Will I lose my Google rankings?',
      answer:
        'No. We preserve your SEO with proper redirects and URL mapping. Most clients actually see better rankings within 3 months because faster sites rank higher on Google.',
      category: 'Migration & Downtime',
      tags: ['seo', 'rankings', 'google', 'optimization'],
    },

    // Timeline & Process
    {
      id: '7',
      question: 'How long will this take?',
      answer:
        "Simple WordPress migrations take 2-4 weeks. More complex projects take 8-16 weeks. We'll give you an exact timeline after reviewing your current site.",
      category: 'Timeline & Process',
      tags: ['timeline', 'duration', 'schedule', 'delivery'],
    },
    {
      id: '8',
      question: 'What happens to all my content and images?',
      answer:
        "We migrate everything - all your pages, blog posts, images, files, and data. Nothing gets lost. We'll even improve your content organisation and make it easier to manage.",
      category: 'Timeline & Process',
      tags: ['content', 'migration', 'data', 'images'],
    },
    {
      id: '9',
      question: 'Can you keep my custom features and plugins?',
      answer:
        "Yes. We'll rebuild your custom features with modern code that's faster and more reliable. If you have essential plugins, we'll either migrate them or build better alternatives.",
      category: 'Timeline & Process',
      tags: ['custom', 'features', 'plugins', 'functionality'],
    },

    // Support & Training
    {
      id: '10',
      question: 'Will I need to learn complicated new software?',
      answer:
        "No. We'll train your team on everything, and modern systems are actually easier to use than WordPress. Most clients find updating content is simpler and faster than before.",
      category: 'Support & Training',
      tags: ['training', 'ease-of-use', 'learning', 'team'],
    },
    {
      id: '11',
      question: 'What if I need help after the site launches?',
      answer:
        "All projects include 3-12 months of support (depending on your package). We're here to fix bugs, answer questions, and help with updates. You can also add ongoing support plans.",
      category: 'Support & Training',
      tags: ['support', 'maintenance', 'post-launch', 'help'],
    },
    {
      id: '12',
      question: 'What if I want to add new features later?',
      answer:
        'Easy. Modern architecture makes adding features faster and cheaper than WordPress. Changes that used to take weeks now take days, and cost 60% less.',
      category: 'Support & Training',
      tags: ['features', 'updates', 'changes', 'flexibility'],
    },
  ];

  const categories = [
    'Cost & Investment',
    'Migration & Downtime',
    'Timeline & Process',
    'Support & Training',
  ];

  return (
    <InteractiveFAQ
      title={
        <span className="heading-section font-medium leading-tight tracking-[-0.02em]">
          <span className="text-ethos-navy">Frequently Asked </span>
          <span
            className="bg-clip-text text-transparent"
            style={{ backgroundImage: 'linear-gradient(to right, var(--ethos-purple), #000000)' }}
          >
            Questions
          </span>
        </span>
      }
      description="Get straight answers to the questions Australian businesses ask us most about WordPress migration, costs, and going modern"
      faqs={faqs}
      categories={categories}
      showSearch={true}
      showCategories={true}
      contactCTA={{
        text: 'Get Your Free Assessment',
        link: '/contact?source=digital-solutions-faq',
      }}
    />
  );
};
