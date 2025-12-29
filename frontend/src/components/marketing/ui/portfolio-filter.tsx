import React, { useState, useMemo } from 'react';
import { Search, Filter, ExternalLink, Code, Smartphone, Globe, Star } from 'lucide-react';
import { Card } from '@/components/marketing/ui/card';
import { Button } from '@/components/marketing/ui/button';
import { Badge } from '@/components/marketing/ui/badge';

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  image: string;
  category: 'web' | 'mobile' | 'both';
  industry: string;
  technologies: string[];
  features: string[];
  liveUrl?: string;
  caseStudyUrl?: string;
  rating?: number;
  completionDate: string;
  projectDuration: string;
  clientSize: 'startup' | 'small' | 'medium' | 'enterprise';
}

interface PortfolioFilterProps {
  items: PortfolioItem[];
  title?: string;
  description?: string;
  showSearch?: boolean;
  showFilters?: boolean;
  itemsPerPage?: number;
  className?: string;
}

const defaultPortfolioItems: PortfolioItem[] = [
  {
    id: '1',
    title: 'E-commerce Mobile App',
    description: 'Full-featured mobile shopping app with AI recommendations and seamless checkout',
    image: '/assets/marketing/images/portfolio/ecommerce-app.jpg',
    category: 'mobile',
    industry: 'E-commerce',
    technologies: ['React Native', 'Node.js', 'MongoDB', 'Stripe'],
    features: ['AI Recommendations', 'Push Notifications', 'Offline Mode', 'Payment Integration'],
    liveUrl: 'https://app.example.com',
    caseStudyUrl: '/case-studies/ecommerce-app',
    rating: 4.9,
    completionDate: '2024-01',
    projectDuration: '4 months',
    clientSize: 'medium'
  },
  {
    id: '2',
    title: 'Healthcare Management Platform',
    description: 'Comprehensive web platform for patient management and telemedicine',
    image: '/assets/marketing/images/portfolio/healthcare-platform.jpg',
    category: 'web',
    industry: 'Healthcare',
    technologies: ['React', 'Python', 'PostgreSQL', 'WebRTC'],
    features: ['Video Consultations', 'Patient Records', 'Appointment Scheduling', 'HIPAA Compliant'],
    liveUrl: 'https://healthplatform.example.com',
    caseStudyUrl: '/case-studies/healthcare-platform',
    rating: 4.8,
    completionDate: '2023-12',
    projectDuration: '6 months',
    clientSize: 'enterprise'
  },
  {
    id: '3',
    title: 'FinTech Mobile & Web App',
    description: 'Cross-platform financial management solution with real-time analytics',
    image: '/assets/marketing/images/portfolio/fintech-app.jpg',
    category: 'both',
    industry: 'Financial Services',
    technologies: ['Flutter', 'React', 'Go', 'Redis', 'Kubernetes'],
    features: ['Real-time Analytics', 'Secure Transactions', 'Multi-platform', 'API Integration'],
    liveUrl: 'https://fintech.example.com',
    caseStudyUrl: '/case-studies/fintech-app',
    rating: 4.7,
    completionDate: '2024-02',
    projectDuration: '8 months',
    clientSize: 'startup'
  }
];

export const PortfolioFilter: React.FC<PortfolioFilterProps> = ({
  items = defaultPortfolioItems,
  title = "Our Portfolio",
  description = "Explore our successful projects across web and mobile development",
  showSearch = true,
  showFilters = true,
  itemsPerPage = 6,
  className = ""
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTechnology, setSelectedTechnology] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Get unique values for filters
  const categories = ['all', 'web', 'mobile', 'both'];
  const industries = ['all', ...Array.from(new Set(items.map(item => item.industry)))];
  const technologies = ['all', ...Array.from(new Set(items.flatMap(item => item.technologies)))];

  // Filter items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = searchTerm === '' ||
        item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.technologies.some(tech => tech.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesIndustry = selectedIndustry === 'all' || item.industry === selectedIndustry;
      const matchesTechnology = selectedTechnology === 'all' || item.technologies.includes(selectedTechnology);

      return matchesSearch && matchesCategory && matchesIndustry && matchesTechnology;
    });
  }, [items, searchTerm, selectedCategory, selectedIndustry, selectedTechnology]);

  // Paginate items
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredItems.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredItems, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'web':
        return <Globe className="w-4 h-4" />;
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'both':
        return <Code className="w-4 h-4" />;
      default:
        return <Code className="w-4 h-4" />;
    }
  };

  const handleFilterChange = (filterType: string, value: string) => {
    setCurrentPage(1); // Reset to first page when filtering
    switch (filterType) {
      case 'category':
        setSelectedCategory(value);
        break;
      case 'industry':
        setSelectedIndustry(value);
        break;
      case 'technology':
        setSelectedTechnology(value);
        break;
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedIndustry('all');
    setSelectedTechnology('all');
    setCurrentPage(1);
  };

  return (
    <section className={`py-16 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold text-ethos-navy mb-4">
            {title}
          </h2>
          <p className="text-xl text-ethos-gray max-w-3xl mx-auto">
            {description}
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8">
          {/* Search Bar */}
          {showSearch && (
            <div className="relative max-w-md mx-auto">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search projects..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple text-gray-900"
              />
            </div>
          )}

          {/* Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 justify-center items-center">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-ethos-gray" />
                <span className="text-sm font-medium text-ethos-gray">Filter by:</span>
              </div>

              {/* Category Filter */}
              <select
                value={selectedCategory}
                onChange={(e) => handleFilterChange('category', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
              >
                {categories.map(category => (
                  <option key={category} value={category}>
                    {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                  </option>
                ))}
              </select>

              {/* Industry Filter */}
              <select
                value={selectedIndustry}
                onChange={(e) => handleFilterChange('industry', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry === 'all' ? 'All Industries' : industry}
                  </option>
                ))}
              </select>

              {/* Technology Filter */}
              <select
                value={selectedTechnology}
                onChange={(e) => handleFilterChange('technology', e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple"
              >
                {technologies.map(tech => (
                  <option key={tech} value={tech}>
                    {tech === 'all' ? 'All Technologies' : tech}
                  </option>
                ))}
              </select>

              {/* Clear Filters */}
              <Button
                variant="outline"
                size="sm"
                onClick={clearFilters}
                className="text-ethos-purple border-ethos-purple hover:bg-ethos-purple hover:text-white"
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>

        {/* Results Count */}
        <div className="text-center mb-8">
          <p className="text-ethos-gray">
            Showing {paginatedItems.length} of {filteredItems.length} projects
          </p>
        </div>

        {/* Portfolio Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {paginatedItems.map((item) => (
            <Card key={item.id} className="overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="relative">
                <img
                  src={item.image}
                  alt={item.title}
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-4 left-4">
                  <Badge className="bg-ethos-purple text-white">
                    {getCategoryIcon(item.category)}
                    <span className="ml-1">{item.category}</span>
                  </Badge>
                </div>
                {item.rating && (
                  <div className="absolute top-4 right-4 bg-white rounded-full px-2 py-1 flex items-center gap-1">
                    <Star className="w-3 h-3 text-yellow-400 fill-current" />
                    <span className="text-xs font-medium">{item.rating}</span>
                  </div>
                )}
              </div>

              <div className="p-6">
                <h3 className="text-xl font-semibold text-ethos-navy mb-2">{item.title}</h3>
                <p className="text-ethos-gray mb-4">{item.description}</p>

                <div className="mb-4">
                  <div>
                    <span className="text-sm font-medium text-ethos-purple">Industry:</span>
                    <span className="text-sm text-ethos-gray ml-2">{item.industry}</span>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-ethos-purple">Duration:</span>
                    <span className="text-sm text-ethos-gray ml-2">{item.projectDuration}</span>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-4">
                  {item.technologies.slice(0, 3).map(tech => (
                    <Badge key={tech} variant="secondary" className="text-xs">
                      {tech}
                    </Badge>
                  ))}
                  {item.technologies.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{item.technologies.length - 3} more
                    </Badge>
                  )}
                </div>

                <div className="flex gap-2">
                  {item.liveUrl && (
                    <Button size="sm" variant="outline" asChild>
                      <a href={item.liveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4 mr-1" />
                        Live Demo
                      </a>
                    </Button>
                  )}
                  {item.caseStudyUrl && (
                    <Button size="sm" variant="ethos" asChild>
                      <a href={item.caseStudyUrl}>
                        Case Study
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                onClick={() => setCurrentPage(page)}
                className={currentPage === page ? "bg-ethos-purple hover:bg-ethos-purple/90" : ""}
              >
                {page}
              </Button>
            ))}

            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </section>
  );
};
