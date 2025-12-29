import React from 'react';
import { cn } from '@/lib/marketing-utils';
import { Card } from '@/components/marketing/ui/card';

interface MessageBoxProps {
  isVisible: boolean;
}

export default function MessageBox({ isVisible }: MessageBoxProps) {
  return (
    <Card 
      className={cn(
        "absolute bottom-full right-0 w-64 p-3",
        "transform transition-all duration-200 ease-in-out",
        "opacity-0 translate-y-2 pointer-events-none",
        isVisible && "opacity-100 translate-y-0 pointer-events-auto",
        "border-ethos-purple-light/20 shadow-md"
      )}
    >
      <div className="flex flex-col px-3 py-1 pr-4">
        <p className="font-semibold text-foreground text-body-small whitespace-nowrap">Hi, I'm Molē! Need any help?</p>
        <p className="text-muted-foreground text-caption mt-1">I'm here if you need me.</p>
      </div>
    </Card>
  );
}
