/**
 * Loading skeleton for Help Center
 * Displays placeholder content while data is being fetched
 */

import React from 'react';

export const HelpCenterSkeleton: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header Skeleton */}
        <div className="mb-8">
          <div className="h-10 bg-muted rounded-md w-64 mb-4 animate-pulse" />
          <div className="h-6 bg-muted rounded-md w-96 animate-pulse" />
        </div>

        {/* Search Bar Skeleton */}
        <div className="mb-8">
          <div className="h-12 bg-muted rounded-lg w-full max-w-2xl animate-pulse" />
        </div>

        {/* Popular Searches Skeleton */}
        <div className="mb-8">
          <div className="h-5 bg-muted rounded-md w-40 mb-4 animate-pulse" />
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-8 bg-muted rounded-full w-32 animate-pulse" />
            ))}
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Sidebar Skeleton */}
          <aside className="lg:col-span-1">
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="h-6 bg-muted rounded-md w-32 mb-4 animate-pulse" />
              <div >
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} >
                    <div className="h-10 bg-muted rounded-md animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </aside>

          {/* Articles Grid Skeleton */}
          <main className="lg:col-span-3">
            <div >
              {/* Filter Bar Skeleton */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="h-10 bg-muted rounded-md w-40 animate-pulse" />
                <div className="h-10 bg-muted rounded-md w-40 animate-pulse" />
                <div className="h-10 bg-muted rounded-md w-40 animate-pulse" />
              </div>

              {/* Article Cards Skeleton */}
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-card border border-border rounded-lg p-6 animate-pulse"
                >
                  {/* Badges */}
                  <div className="flex gap-2 mb-3">
                    <div className="h-6 bg-muted rounded-full w-20" />
                    <div className="h-6 bg-muted rounded-full w-24" />
                  </div>

                  {/* Title */}
                  <div className="h-7 bg-muted rounded-md w-3/4 mb-3" />

                  {/* Excerpt */}
                  <div className="mb-4">
                    <div className="h-4 bg-muted rounded-md w-full" />
                    <div className="h-4 bg-muted rounded-md w-5/6" />
                  </div>

                  {/* Metadata */}
                  <div className="flex gap-4">
                    <div className="h-4 bg-muted rounded-md w-20" />
                    <div className="h-4 bg-muted rounded-md w-20" />
                    <div className="h-4 bg-muted rounded-md w-20" />
                  </div>

                  {/* Tags */}
                  <div className="flex gap-2 mt-3">
                    <div className="h-6 bg-muted rounded-full w-16" />
                    <div className="h-6 bg-muted rounded-full w-20" />
                    <div className="h-6 bg-muted rounded-full w-16" />
                  </div>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
};

export default HelpCenterSkeleton;

