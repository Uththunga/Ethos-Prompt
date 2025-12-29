import type { PromptExecution } from '../types';
import { formatCurrency, formatDuration, formatNumber } from './formatters';

/**
 * Export executions to JSON format
 */
export const exportToJSON = (executions: PromptExecution[]): string => {
  return JSON.stringify(executions, null, 2);
};

/**
 * Export executions to CSV format
 */
export const exportToCSV = (executions: PromptExecution[]): string => {
  if (executions.length === 0) {
    return '';
  }

  // Define CSV headers
  const headers = [
    'ID',
    'Timestamp',
    'Status',
    'Model',
    'Prompt',
    'Response',
    'Input Tokens',
    'Output Tokens',
    'Total Tokens',
    'Cost',
    'Duration (ms)',
    'Duration (formatted)',
    'Error',
    'Rating',
    'Feedback',
  ];

  // Helper function to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) {
      return '';
    }
    const stringValue = String(value);
    // Escape quotes and wrap in quotes if contains comma, quote, or newline
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  // Build CSV rows
  const rows = executions.map((execution) => {
    const totalTokens = (execution.inputTokens || 0) + (execution.outputTokens || 0);
    return [
      escapeCSV(execution.id),
      escapeCSV(execution.timestamp ? new Date(execution.timestamp).toISOString() : ''),
      escapeCSV(execution.status),
      escapeCSV(execution.model),
      escapeCSV(execution.prompt),
      escapeCSV(execution.response),
      escapeCSV(execution.inputTokens || 0),
      escapeCSV(execution.outputTokens || 0),
      escapeCSV(totalTokens),
      escapeCSV(execution.cost || 0),
      escapeCSV(execution.duration || 0),
      escapeCSV(formatDuration(execution.duration || 0)),
      escapeCSV(execution.error),
      escapeCSV(execution.rating || ''),
      escapeCSV(execution.feedback || ''),
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\n');
};

/**
 * Export executions to Markdown format
 */
export const exportToMarkdown = (executions: PromptExecution[]): string => {
  if (executions.length === 0) {
    return '# Execution Export\n\nNo executions to export.';
  }

  let markdown = '# Execution Export\n\n';
  markdown += `**Total Executions:** ${executions.length}\n`;
  markdown += `**Export Date:** ${new Date().toLocaleString()}\n\n`;
  markdown += '---\n\n';

  executions.forEach((execution, index) => {
    markdown += `## Execution ${index + 1}\n\n`;

    // Metadata table
    markdown += '### Metadata\n\n';
    markdown += '| Property | Value |\n';
    markdown += '|----------|-------|\n';
    markdown += `| **ID** | \`${execution.id}\` |\n`;
    markdown += `| **Timestamp** | ${
      execution.timestamp ? new Date(execution.timestamp).toLocaleString() : 'N/A'
    } |\n`;
    markdown += `| **Status** | ${execution.status} |\n`;
    markdown += `| **Model** | ${execution.model || 'N/A'} |\n`;
    markdown += `| **Input Tokens** | ${formatNumber(execution.inputTokens || 0)} |\n`;
    markdown += `| **Output Tokens** | ${formatNumber(execution.outputTokens || 0)} |\n`;
    markdown += `| **Total Tokens** | ${formatNumber(
      (execution.inputTokens || 0) + (execution.outputTokens || 0)
    )} |\n`;
    markdown += `| **Cost** | ${formatCurrency(execution.cost || 0)} |\n`;
    markdown += `| **Duration** | ${formatDuration(execution.duration || 0)} |\n`;

    if (execution.rating) {
      markdown += `| **Rating** | ${'⭐'.repeat(execution.rating)} (${execution.rating}/5) |\n`;
    }

    if (execution.error) {
      markdown += `| **Error** | ${execution.error} |\n`;
    }

    markdown += '\n';

    // Prompt
    markdown += '### Prompt\n\n';
    markdown += '```\n';
    markdown += execution.prompt || 'N/A';
    markdown += '\n```\n\n';

    // Response
    markdown += '### Response\n\n';
    if (execution.status === 'completed' && execution.response) {
      markdown += '```\n';
      markdown += execution.response;
      markdown += '\n```\n\n';
    } else if (execution.status === 'failed') {
      markdown += `*Execution failed: ${execution.error || 'Unknown error'}*\n\n`;
    } else {
      markdown += '*No response available*\n\n';
    }

    // Feedback
    if (execution.feedback) {
      markdown += '### Feedback\n\n';
      markdown += execution.feedback;
      markdown += '\n\n';
    }

    markdown += '---\n\n';
  });

  // Summary statistics
  markdown += '## Summary Statistics\n\n';

  const completed = executions.filter((e) => e.status === 'completed').length;
  const failed = executions.filter((e) => e.status === 'failed').length;
  const totalCost = executions.reduce((sum, e) => sum + (e.cost || 0), 0);
  const totalTokens = executions.reduce(
    (sum, e) => sum + (e.inputTokens || 0) + (e.outputTokens || 0),
    0
  );
  const avgDuration = executions.reduce((sum, e) => sum + (e.duration || 0), 0) / executions.length;

  markdown += `- **Total Executions:** ${executions.length}\n`;
  markdown += `- **Completed:** ${completed} (${((completed / executions.length) * 100).toFixed(
    1
  )}%)\n`;
  markdown += `- **Failed:** ${failed} (${((failed / executions.length) * 100).toFixed(1)}%)\n`;
  markdown += `- **Total Cost:** ${formatCurrency(totalCost)}\n`;
  markdown += `- **Total Tokens:** ${formatNumber(totalTokens)}\n`;
  markdown += `- **Average Duration:** ${formatDuration(avgDuration)}\n`;

  return markdown;
};

/**
 * Download exported data as a file
 */
export const downloadExport = (
  data: string,
  filename: string,
  mimeType: string = 'text/plain'
): void => {
  const blob = new Blob([data], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Export executions with format selection
 */
export const exportExecutions = (
  executions: PromptExecution[],
  format: 'json' | 'csv' | 'markdown'
): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  switch (format) {
    case 'json': {
      const jsonData = exportToJSON(executions);
      downloadExport(jsonData, `executions-${timestamp}.json`, 'application/json');
      break;
    }

    case 'csv': {
      const csvData = exportToCSV(executions);
      downloadExport(csvData, `executions-${timestamp}.csv`, 'text/csv');
      break;
    }

    case 'markdown': {
      const markdownData = exportToMarkdown(executions);
      downloadExport(markdownData, `executions-${timestamp}.md`, 'text/markdown');
      break;
    }

    default:
      throw new Error(`Unsupported export format: ${format}`);
  }
};

/**
 * Copy exported data to clipboard
 */
export const copyToClipboard = async (
  executions: PromptExecution[],
  format: 'json' | 'csv' | 'markdown'
): Promise<void> => {
  let data: string;

  switch (format) {
    case 'json':
      data = exportToJSON(executions);
      break;
    case 'csv':
      data = exportToCSV(executions);
      break;
    case 'markdown':
      data = exportToMarkdown(executions);
      break;
    default:
      throw new Error(`Unsupported export format: ${format}`);
  }

  await navigator.clipboard.writeText(data);
};

/**
 * Bulk export multiple execution sets
 */
export const bulkExport = (
  executionSets: { name: string; executions: PromptExecution[] }[],
  format: 'json' | 'csv' | 'markdown'
): void => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

  executionSets.forEach(({ name, executions }) => {
    const sanitizedName = name.replace(/[^a-z0-9]/gi, '-').toLowerCase();
    const filename = `${sanitizedName}-${timestamp}`;

    switch (format) {
      case 'json': {
        const jsonData = exportToJSON(executions);
        downloadExport(jsonData, `${filename}.json`, 'application/json');
        break;
      }

      case 'csv': {
        const csvData = exportToCSV(executions);
        downloadExport(csvData, `${filename}.csv`, 'text/csv');
        break;
      }

      case 'markdown': {
        const markdownData = exportToMarkdown(executions);
        downloadExport(markdownData, `${filename}.md`, 'text/markdown');
        break;
      }
    }
  });
};
