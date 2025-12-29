import React, { useEffect } from 'react';
import { Button } from '@/components/marketing/ui/button';

interface ThankYouModalProps {
  open: boolean;
  onClose: () => void;
}

const ThankYouModal: React.FC<ThankYouModalProps> = ({ open, onClose }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true" aria-labelledby="thankyou-title" aria-describedby="thankyou-desc">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow-xl">
        <h3 id="thankyou-title" className="text-h3 text-ethos-navy mb-2">Thank you!</h3>
        <p id="thankyou-desc" className="text-ethos-gray mb-6">We received your request. We'll get back to you within 24 hours with next steps.</p>
        <div className="flex justify-end">
          <Button variant="ethos" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
};

export default ThankYouModal;
