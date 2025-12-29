import React from 'react';
import { useMemo } from 'react';

export const WorkflowDiagram = () => {
  // For assets in the public directory, we should use the Vite base URL
  const baseUrl = import.meta.env.BASE_URL || '/';

  // Memoize image paths to prevent recalculation on every render
  const imagePaths = useMemo(() => ({
    webhook: `${baseUrl}assets/images/workflow/083c30391c2df8b29d47092148f52f261935dd5a.png`,
    aiAgent: `${baseUrl}assets/images/workflow/13855b7a8273781d9f25b58a218564e54381bc18.png`,
    chatGPT: `${baseUrl}assets/images/workflow/c70dfe2ca91c5daaf0b6b066c3bf5a9e786c644c.png`,
    memory: `${baseUrl}assets/images/workflow/c28171ed34bf51416803eb53aee265bfc16565c5.png`,
  }), [baseUrl]);

  return (
    <section
      className="relative bg-white rounded-2xl shadow-lg p-4 sm:p-6 lg:p-8 xl:p-12 max-w-7xl mx-auto overflow-hidden"
      aria-labelledby="workflow-heading"
      role="img"
      aria-describedby="workflow-description"
    >
      <h2 id="workflow-heading" className="sr-only">AI Agent Workflow Diagram</h2>
      <p id="workflow-description" className="sr-only">
        A visual diagram showing the workflow of AI agents: webhook receives data, sends to AI agent, which processes with ChatGPT and memory, then responds back to webhook and can trigger additional workflows.
      </p>

      {/* Workflow Steps */}
      <div className="flex flex-col items-center sm:" role="presentation">
        {/* Step 1: Webhook */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-16 sm:w-32 sm:h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-3 sm:mb-4">
            <img
              src={imagePaths.webhook}
              alt="Webhook icon"
              className="w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>
          <h3 className="text-gray-700 text-xs sm:text-sm font-semibold text-center">Webhook</h3>
        </div>

        {/* Arrow Down */}
        <div className="w-0 h-8 sm:h-12 border-l-2 border-purple-500" aria-hidden="true"></div>

        {/* Step 2: AI Agent */}
        <div className="flex flex-col items-center">
          <div className="w-48 h-18 sm:w-64 sm:h-24 bg-white rounded-2xl shadow-md flex items-center justify-center mb-3 sm:mb-4 px-4">
            <img
              src={imagePaths.aiAgent}
              alt="AI Agent icon"
              className="w-8 h-8 sm:w-10 sm:h-10 mr-2 sm:mr-3 flex-shrink-0"
            />
            <h3 className="text-black text-xs sm:text-sm font-semibold">Your AI Agent</h3>
          </div>
        </div>

        {/* Arrow Down */}
        <div className="w-0 h-8 sm:h-12 border-l-2 border-purple-500" aria-hidden="true"></div>

        {/* Step 3: Response */}
        <div className="flex flex-col items-center">
          <div className="w-24 h-16 sm:w-32 sm:h-20 bg-white rounded-2xl shadow-md flex items-center justify-center mb-3 sm:mb-4">
            <img
              src={imagePaths.webhook}
              alt="Response webhook icon"
              className="w-12 h-12 sm:w-16 sm:h-16"
            />
          </div>
          <h3 className="text-gray-700 text-xs sm:text-sm font-semibold text-center">
            Response to the Webhook
          </h3>
        </div>

        {/* Arrow Down */}
        <div className="w-0 h-8 sm:h-12 border-l-2 border-purple-500" aria-hidden="true"></div>

        {/* Step 4: Additional Workflow */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white rounded-lg shadow-md flex items-center justify-center mb-3 sm:mb-4">
            <span className="text-gray-700 text-lg sm:text-2xl font-bold" aria-label="Plus symbol">+</span>
          </div>
          <h3 className="text-gray-700 text-xs sm:text-sm font-semibold text-center">
            Open to Trigger<br />another workflow
          </h3>
        </div>
      </div>

      {/* Side Elements - Hidden on small screens, positioned on larger screens */}
      <aside className="hidden md:block absolute top-6 lg:top-8 left-4 lg:left-8 lg:" aria-label="AI Integration Tools">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <img
              src={imagePaths.chatGPT}
              alt="ChatGPT logo"
              className="w-5 h-5 lg:w-8 lg:h-8"
            />
          </div>
          <span className="text-gray-700 text-xs font-semibold">Chat GPT or any LLM</span>
        </div>

        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <img
              src={imagePaths.memory}
              alt="Memory storage icon"
              className="w-5 h-5 lg:w-8 lg:h-8"
            />
          </div>
          <span className="text-gray-700 text-xs font-semibold">Simple Memory</span>
        </div>
      </aside>

      <aside className="hidden md:block absolute top-6 lg:top-8 right-4 lg:right-8 lg:" aria-label="Integration Categories">
        <h4 className="sr-only">Available Tool Categories</h4>
        <span className="text-gray-700 text-xs font-semibold block">Productivity Tools</span>
        <span className="text-gray-700 text-xs font-semibold block">Financial Tools</span>
        <span className="text-gray-700 text-xs font-semibold block">Communication Tools</span>
      </aside>

      <aside className="hidden md:block absolute bottom-6 lg:bottom-8 left-4 lg:left-8" aria-label="Data Sources">
        <div className="flex items-center gap-2 lg:gap-3">
          <div className="w-8 h-8 lg:w-12 lg:h-12 bg-white rounded-full shadow-md flex items-center justify-center">
            <img
              src={imagePaths.memory}
              alt="Contacts data icon"
              className="w-5 h-5 lg:w-8 lg:h-8"
            />
          </div>
          <span className="text-gray-700 text-xs font-semibold">Contacts Data</span>
        </div>
      </aside>
    </section>
  );
};
