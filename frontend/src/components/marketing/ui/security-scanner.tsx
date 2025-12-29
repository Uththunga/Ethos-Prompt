import { Badge } from '@/components/marketing/ui/badge';
import { Button } from '@/components/marketing/ui/button';
import { Card } from '@/components/marketing/ui/card';
import { AlertTriangle, CheckCircle, Database, Globe, Loader, Lock, RefreshCw, Server, Shield, X } from 'lucide-react';
import React, { useState } from 'react';

interface SecurityCheck {
  id: string;
  name: string;
  category: 'network' | 'application' | 'data' | 'infrastructure';
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'pending' | 'scanning' | 'passed' | 'failed' | 'warning';
  description: string;
  recommendation?: string;
  impact?: string;
}

interface ScanResult {
  overallScore: number;
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warningChecks: number;
  checks: SecurityCheck[];
  scanDuration: number;
  lastScanDate: string;
}

interface SecurityScannerProps {
  title?: React.ReactNode;
  description?: string;
  onScanComplete?: (result: ScanResult) => void;
  onEmailCapture?: (email: string, result: ScanResult) => void;
  className?: string;
}

const defaultSecurityChecks: SecurityCheck[] = [
  {
    id: 'ssl-cert',
    name: 'SSL Certificate Validation',
    category: 'network',
    severity: 'high',
    status: 'pending',
    description: 'Validates SSL certificate configuration and expiration',
    recommendation: 'Ensure SSL certificate is valid and properly configured',
    impact: 'Prevents data interception and builds user trust'
  },
  {
    id: 'sql-injection',
    name: 'SQL Injection Vulnerability',
    category: 'application',
    severity: 'critical',
    status: 'pending',
    description: 'Scans for SQL injection vulnerabilities in web applications',
    recommendation: 'Use parameterized queries and input validation',
    impact: 'Prevents unauthorized database access and data breaches'
  },
  {
    id: 'xss-protection',
    name: 'Cross-Site Scripting (XSS)',
    category: 'application',
    severity: 'high',
    status: 'pending',
    description: 'Checks for XSS vulnerabilities in user input handling',
    recommendation: 'Implement proper input sanitization and CSP headers',
    impact: 'Prevents malicious script execution and session hijacking'
  },
  {
    id: 'data-encryption',
    name: 'Data Encryption at Rest',
    category: 'data',
    severity: 'high',
    status: 'pending',
    description: 'Verifies that sensitive data is encrypted in storage',
    recommendation: 'Implement AES-256 encryption for sensitive data',
    impact: 'Protects data even if storage is compromised'
  },
  {
    id: 'access-controls',
    name: 'Access Control Configuration',
    category: 'infrastructure',
    severity: 'medium',
    status: 'pending',
    description: 'Reviews user access controls and permissions',
    recommendation: 'Implement principle of least privilege',
    impact: 'Reduces risk of unauthorized access and data exposure'
  },
  {
    id: 'backup-security',
    name: 'Backup Security Assessment',
    category: 'data',
    severity: 'medium',
    status: 'pending',
    description: 'Evaluates backup encryption and access controls',
    recommendation: 'Encrypt backups and test restoration procedures',
    impact: 'Ensures business continuity and data recovery capabilities'
  }
];

export const SecurityScanner: React.FC<SecurityScannerProps> = ({
  title = "Free Security Assessment",
  description = "Get a comprehensive security scan of your digital infrastructure",
  onScanComplete,
  onEmailCapture,
  className = ""
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [currentCheck, setCurrentCheck] = useState<string>('');
  const [showEmailCapture, setShowEmailCapture] = useState(false);
  const [email, setEmail] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const startScan = async () => {
    if (!websiteUrl) return;

    setIsScanning(true);
    setScanResult(null);
    setCurrentCheck('');

    const checks = [...defaultSecurityChecks];
    const startTime = Date.now();

    // Simulate scanning process
    for (let i = 0; i < checks.length; i++) {
      const check = checks[i];
      setCurrentCheck(check.name);

      // Simulate scan time
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));

      // Simulate results (in real implementation, this would call actual security APIs)
      const outcomes = ['passed', 'failed', 'warning'] as const;
      const weights = check.severity === 'critical' ? [0.3, 0.5, 0.2] :
                    check.severity === 'high' ? [0.5, 0.3, 0.2] :
                    check.severity === 'medium' ? [0.7, 0.2, 0.1] : [0.8, 0.1, 0.1];

      const random = Math.random();
      let outcome: typeof outcomes[number] = 'passed';
      let cumulative = 0;
      for (let j = 0; j < outcomes.length; j++) {
        cumulative += weights[j];
        if (random <= cumulative) {
          outcome = outcomes[j];
          break;
        }
      }

      checks[i] = { ...check, status: outcome };
    }

    const endTime = Date.now();
    const scanDuration = Math.round((endTime - startTime) / 1000);

    const passedChecks = checks.filter(c => c.status === 'passed').length;
    const failedChecks = checks.filter(c => c.status === 'failed').length;
    const warningChecks = checks.filter(c => c.status === 'warning').length;

    // Calculate overall score
    const overallScore = Math.round((passedChecks / checks.length) * 100);

    const result: ScanResult = {
      overallScore,
      totalChecks: checks.length,
      passedChecks,
      failedChecks,
      warningChecks,
      checks,
      scanDuration,
      lastScanDate: new Date().toISOString()
    };

    setScanResult(result);
    setIsScanning(false);
    setCurrentCheck('');

    if (onScanComplete) {
      onScanComplete(result);
    }

    // Show email capture for detailed report
    if (failedChecks > 0 || warningChecks > 0) {
      setShowEmailCapture(true);
    }
  };

  const handleEmailSubmit = () => {
    if (email && scanResult && onEmailCapture) {
      onEmailCapture(email, scanResult);
      setShowEmailCapture(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'network':
        return <Globe className="w-4 h-4" />;
      case 'application':
        return <Shield className="w-4 h-4" />;
      case 'data':
        return <Database className="w-4 h-4" />;
      case 'infrastructure':
        return <Server className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-ethos-navy/10 text-ethos-navy';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <X className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'scanning':
        return <Loader className="w-5 h-5 text-ethos-purple animate-spin" />;
      default:
        return <div className="w-5 h-5 bg-gray-300 rounded-full" />;
    }
  };

  return (
    <section className={`py-20 lg:py-24 bg-gradient-to-br from-gray-50 to-white ${className}`}>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-ethos-navy">
            {title}
          </h2>
          <p className="text-xl text-ethos-gray max-w-3xl mx-auto mt-4">
            {description}
          </p>
        </div>

        {/* Scan Input */}
        {!scanResult && (
          <Card className="p-8 mb-10 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <label className="block text-sm font-medium text-ethos-navy mb-2">
                  Website URL to Scan
                </label>
                <input
                  type="url"
                  placeholder="https://your-website.com"
                  value={websiteUrl}
                  onChange={(e) => setWebsiteUrl(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple text-ethos-navy"
                  disabled={isScanning}
                />
              </div>
              <Button
                onClick={startScan}
                disabled={!websiteUrl || isScanning}
                className="w-full mt-2 py-4 px-6 text-base font-medium rounded-full bg-ethos-purple text-white hover:bg-ethos-purple/90 transition-colors"
              >
                {isScanning ? 'Scanning...' : 'Start Security Scan'}
              </Button>
            </div>
          </Card>
        )}

        {/* Scanning Progress */}
        {isScanning && (
          <Card className="p-8 mb-10 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}>
            <div className="text-center">
              <Loader className="w-12 h-12 text-ethos-purple mx-auto mb-6 animate-spin" />
              <h3 className="text-xl font-semibold text-ethos-navy mb-3">
                Security Scan in Progress
              </h3>
              <p className="text-ethos-gray mb-6">
                Currently checking: {currentCheck}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                <div
                  className="bg-ethos-purple h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${(defaultSecurityChecks.findIndex(c => c.name === currentCheck) + 1) / defaultSecurityChecks.length * 100}%`
                  }}
                />
              </div>
              <p className="text-sm text-ethos-gray">
                {Math.round((defaultSecurityChecks.findIndex(c => c.name === currentCheck) + 1) / defaultSecurityChecks.length * 100)}% Complete
              </p>
            </div>
          </Card>
        )}

        {/* Scan Results */}
        {scanResult && (
          <div className="flex flex-col gap-8">
            {/* Overall Score */}
            <Card className="p-8 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}>
              <div className="text-center">
                <div className={`inline-flex items-center justify-center w-28 h-28 rounded-full text-4xl font-bold mb-6 ${
                  scanResult.overallScore >= 80 ? 'bg-green-100 text-green-800' :
                  scanResult.overallScore >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {scanResult.overallScore}
                </div>
                <h3 className="text-2xl font-bold text-ethos-navy mb-3">
                  Security Score
                </h3>
                <p className="text-ethos-gray mb-6">
                  {scanResult.passedChecks} of {scanResult.totalChecks} checks passed
                </p>
                <div className="grid grid-cols-3 gap-6 max-w-md mx-auto">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{scanResult.passedChecks}</div>
                    <div className="text-sm text-green-700 font-medium">Passed</div>
                  </div>
                  <div className="bg-yellow-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{scanResult.warningChecks}</div>
                    <div className="text-sm text-yellow-700 font-medium">Warnings</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{scanResult.failedChecks}</div>
                    <div className="text-sm text-red-700 font-medium">Failed</div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Detailed Results */}
            <Card className="p-8 rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}>
              <h3 className="text-2xl font-semibold text-ethos-navy mb-8">
                Detailed Security Assessment
              </h3>
              <div className="flex flex-col gap-5">
                {scanResult.checks.map((check) => (
                  <div key={check.id} className="border border-gray-200 rounded-lg p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {getCategoryIcon(check.category)}
                        </div>
                        <div>
                          <h4 className="font-semibold text-ethos-navy text-lg">{check.name}</h4>
                          <Badge className={`${getSeverityColor(check.severity)} mt-1`}>
                            {check.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1">
                        {getStatusIcon(check.status)}
                      </div>
                    </div>
                    <p className="text-ethos-gray mb-4 leading-relaxed">{check.description}</p>
                    {check.status === 'failed' && check.recommendation && (
                      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
                        <p className="text-red-800">
                          <strong className="font-medium">Recommendation:</strong> {check.recommendation}
                        </p>
                        {check.impact && (
                          <p className="text-red-700 text-sm mt-2">
                            <strong className="font-medium">Impact:</strong> {check.impact}
                          </p>
                        )}
                      </div>
                    )}
                    {check.status === 'warning' && check.recommendation && (
                      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-r-lg">
                        <p className="text-yellow-800">
                          <strong className="font-medium">Recommendation:</strong> {check.recommendation}
                        </p>
                        {check.impact && (
                          <p className="text-yellow-700 text-sm mt-2">
                            <strong className="font-medium">Impact:</strong> {check.impact}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Email Capture Modal */}
            {showEmailCapture && (
              <Card className="p-8 border-2 border-ethos-purple rounded-2xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1" style={{ boxShadow: '0 15px 35px -5px rgba(128, 128, 128, 0.15)' }}>
                <div className="text-center">
                  <div className="w-16 h-16 bg-ethos-purple/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock className="w-8 h-8 text-ethos-purple" />
                  </div>
                  <h3 className="text-2xl font-bold text-ethos-navy mb-3">
                    Get Your Detailed Security Report
                  </h3>
                  <p className="text-ethos-gray text-lg mb-8 max-w-2xl mx-auto">
                    Enter your email to receive a comprehensive security report with actionable recommendations.
                  </p>
                  <div className="max-w-lg mx-auto flex flex-col gap-4">
                    <div>
                      <input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-4 border border-gray-300 rounded-full focus:ring-2 focus:ring-ethos-purple focus:border-ethos-purple text-ethos-navy"
                      />
                      <p className="text-sm text-gray-500 mt-2 text-left">
                        We'll send your security report and recommendations to this email
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <Button
                        onClick={handleEmailSubmit}
                        disabled={!email}
                        className="flex-1 py-4 px-6 text-base font-medium rounded-full bg-ethos-purple text-white hover:bg-ethos-purple/90 transition-colors"
                      >
                        Get Detailed Report
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setShowEmailCapture(false)}
                        className="py-4 px-6 text-base font-medium rounded-full border-ethos-purple text-ethos-purple hover:bg-ethos-purple/5 transition-colors"
                      >
                        Skip for Now
                      </Button>
                    </div>
                    <p className="text-xs text-gray-400 mt-4">
                      We respect your privacy. Your email is safe with us.
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* New Scan Button */}
            <div className="text-center pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setScanResult(null);
                  setWebsiteUrl('');
                  setShowEmailCapture(false);
                  setEmail('');
                  // Scroll to top of component
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }}
                className="border-ethos-purple text-ethos-purple hover:bg-ethos-purple/10 px-8 py-4 text-base font-medium rounded-full transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <RefreshCw className="w-5 h-5 group-hover:animate-spin" />
                  Scan Another Website
                </span>
              </Button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
