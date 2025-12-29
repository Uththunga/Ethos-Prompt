import React from 'react';
import ShinyText from './ShinyText';

export const ShinyTextTest = () => {
  return (
    <div className="p-8 bg-white">
      <h1 className="text-2xl font-bold mb-4">ShinyText Animation Test</h1>

      {/* Test 1: Basic ShinyText with purple gradient */}
      <div >
        <h2 className="text-lg font-semibold">Test 1: Purple Gradient (3s)</h2>
        <ShinyText
          className="bg-gradient-to-r from-purple-500 via-purple-300 to-purple-500 text-4xl font-bold"
          speedInMs={3000}
        >
          Animated Purple Text
        </ShinyText>
      </div>

      {/* Test 2: Fast animation */}
      <div >
        <h2 className="text-lg font-semibold">Test 2: Fast Animation (1s)</h2>
        <ShinyText
          className="bg-gradient-to-r from-blue-500 via-cyan-300 to-blue-500 text-3xl font-bold"
          speedInMs={1000}
        >
          Fast Shiny Text
        </ShinyText>
      </div>

      {/* Test 3: Ethos colors */}
      <div >
        <h2 className="text-lg font-semibold">Test 3: Ethos Colors (2s)</h2>
        <ShinyText
          className="bg-gradient-to-r from-[#8B5CF6] via-[#A855F7] to-[#8B5CF6] text-3xl font-bold"
          speedInMs={2000}
        >
          Ethos Shiny Text
        </ShinyText>
      </div>

      {/* Test 4: White gradient on dark background */}
      <div className="bg-gray-800 p-4 rounded">
        <h2 className="text-lg font-semibold text-white">Test 4: White Gradient (2s)</h2>
        <ShinyText
          className="bg-gradient-to-r from-white via-gray-200 to-white text-3xl font-bold"
          speedInMs={2000}
        >
          White Shiny Text
        </ShinyText>
      </div>

      {/* Test 5: With hover pause */}
      <div >
        <h2 className="text-lg font-semibold">Test 5: Hover to Pause (3s)</h2>
        <ShinyText
          className="bg-gradient-to-r from-green-500 via-emerald-300 to-green-500 text-3xl font-bold"
          speedInMs={3000}
          pauseOnHover={true}
        >
          Hover to Pause
        </ShinyText>
      </div>

      {/* Manual CSS test */}
      <div >
        <h2 className="text-lg font-semibold">Test 6: Manual CSS Animation</h2>
        <div
          className="text-3xl font-bold bg-gradient-to-r from-red-500 via-yellow-300 to-red-500 bg-clip-text text-transparent"
          style={{
            backgroundSize: '200% auto',
            animation: 'shiny-text-animation 2s linear infinite',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Manual CSS Animation
        </div>
      </div>

      {/* Debug info */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-semibold mb-2">Debug Info:</h3>
        <p>If you don't see animations, check:</p>
        <ul className="list-disc list-inside text-sm">
          <li>Browser developer tools for CSS animation errors</li>
          <li>Reduced motion preferences in your OS/browser</li>
          <li>CSS keyframes are properly loaded</li>
          <li>Background gradients are visible</li>
          <li>Check if 'shiny-text-animation' keyframes exist in CSS</li>
        </ul>

        <div className="mt-4 p-2 bg-white rounded border">
          <h4 className="font-medium mb-1">Expected CSS Keyframes:</h4>
          <pre className="text-xs text-gray-600">
            {`@keyframes shiny-text-animation {
  0% { background-position: 200% center; }
  100% { background-position: -200% center; }
}`}
          </pre>
        </div>
      </div>
    </div>
  );
};

export default ShinyTextTest;
