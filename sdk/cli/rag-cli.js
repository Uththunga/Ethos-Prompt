#!/usr/bin/env node

/**
 * RAG Prompt Library CLI Tool
 * Command-line interface for managing prompts, documents, and workspaces
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs');
const path = require('path');
const { RAGPromptLibrary } = require('@rag-prompt-library/sdk');

const program = new Command();

// Global configuration
let config = {};
const configPath = path.join(process.env.HOME || process.env.USERPROFILE, '.rag-config.json');

// Load configuration
function loadConfig() {
  try {
    if (fs.existsSync(configPath)) {
      config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
  } catch (error) {
    console.error(chalk.red('Error loading configuration:', error.message));
  }
}

// Save configuration
function saveConfig() {
  try {
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
  } catch (error) {
    console.error(chalk.red('Error saving configuration:', error.message));
  }
}

// Initialize client
function getClient() {
  if (!config.apiKey && !config.accessToken) {
    console.error(chalk.red('No API key or access token configured. Run "rag auth login" first.'));
    process.exit(1);
  }
  
  return new RAGPromptLibrary({
    apiKey: config.apiKey,
    accessToken: config.accessToken,
    baseURL: config.baseURL || 'https://api.ragpromptlibrary.com/v1'
  });
}

// CLI Commands

program
  .name('rag')
  .description('RAG Prompt Library CLI')
  .version('1.0.0');

// Authentication commands
const authCommand = program.command('auth').description('Authentication commands');

authCommand
  .command('login')
  .description('Login with API key or interactive authentication')
  .option('-k, --api-key <key>', 'API key for authentication')
  .option('-t, --token <token>', 'Access token for authentication')
  .option('-u, --url <url>', 'Custom API base URL')
  .action(async (options) => {
    if (options.apiKey) {
      config.apiKey = options.apiKey;
      if (options.url) config.baseURL = options.url;
      saveConfig();
      console.log(chalk.green('✓ API key configured successfully'));
      return;
    }

    if (options.token) {
      config.accessToken = options.token;
      if (options.url) config.baseURL = options.url;
      saveConfig();
      console.log(chalk.green('✓ Access token configured successfully'));
      return;
    }

    // Interactive login
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'apiKey',
        message: 'Enter your API key:',
        validate: (input) => input.length > 0 || 'API key is required'
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'API base URL (press enter for default):',
        default: 'https://api.ragpromptlibrary.com/v1'
      }
    ]);

    config.apiKey = answers.apiKey;
    config.baseURL = answers.baseURL;
    saveConfig();
    console.log(chalk.green('✓ Authentication configured successfully'));
  });

authCommand
  .command('logout')
  .description('Remove stored authentication')
  .action(() => {
    config = {};
    saveConfig();
    console.log(chalk.green('✓ Logged out successfully'));
  });

authCommand
  .command('status')
  .description('Show authentication status')
  .action(() => {
    if (config.apiKey || config.accessToken) {
      console.log(chalk.green('✓ Authenticated'));
      console.log(`Base URL: ${config.baseURL || 'https://api.ragpromptlibrary.com/v1'}`);
      console.log(`Auth method: ${config.apiKey ? 'API Key' : 'Access Token'}`);
    } else {
      console.log(chalk.red('✗ Not authenticated'));
    }
  });

// Prompt commands
const promptCommand = program.command('prompts').description('Manage prompts');

promptCommand
  .command('list')
  .description('List all prompts')
  .option('-l, --limit <number>', 'Limit number of results', '10')
  .option('-w, --workspace <id>', 'Filter by workspace')
  .action(async (options) => {
    try {
      const client = getClient();
      const prompts = await client.prompts.list({
        limit: parseInt(options.limit),
        workspace_id: options.workspace
      });

      if (prompts.data.length === 0) {
        console.log(chalk.yellow('No prompts found'));
        return;
      }

      console.log(chalk.blue(`Found ${prompts.data.length} prompts:`));
      prompts.data.forEach(prompt => {
        console.log(`  ${chalk.green(prompt.id)} - ${prompt.title}`);
        console.log(`    ${chalk.gray(prompt.description || 'No description')}`);
        console.log(`    Tags: ${prompt.tags?.join(', ') || 'None'}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('Error listing prompts:', error.message));
    }
  });

promptCommand
  .command('get <id>')
  .description('Get a specific prompt')
  .action(async (id) => {
    try {
      const client = getClient();
      const prompt = await client.prompts.get(id);

      console.log(chalk.blue('Prompt Details:'));
      console.log(`ID: ${prompt.data.id}`);
      console.log(`Title: ${prompt.data.title}`);
      console.log(`Description: ${prompt.data.description || 'None'}`);
      console.log(`Tags: ${prompt.data.tags?.join(', ') || 'None'}`);
      console.log(`Created: ${new Date(prompt.data.created_at).toLocaleString()}`);
      console.log('');
      console.log(chalk.blue('Content:'));
      console.log(prompt.data.content);
    } catch (error) {
      console.error(chalk.red('Error getting prompt:', error.message));
    }
  });

promptCommand
  .command('create')
  .description('Create a new prompt')
  .option('-f, --file <path>', 'Load prompt from file')
  .action(async (options) => {
    try {
      let promptData;

      if (options.file) {
        const filePath = path.resolve(options.file);
        if (!fs.existsSync(filePath)) {
          console.error(chalk.red('File not found:', filePath));
          return;
        }
        promptData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } else {
        // Interactive creation
        promptData = await inquirer.prompt([
          {
            type: 'input',
            name: 'title',
            message: 'Prompt title:',
            validate: (input) => input.length > 0 || 'Title is required'
          },
          {
            type: 'input',
            name: 'description',
            message: 'Description (optional):'
          },
          {
            type: 'editor',
            name: 'content',
            message: 'Prompt content:'
          },
          {
            type: 'input',
            name: 'tags',
            message: 'Tags (comma-separated):',
            filter: (input) => input.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
          }
        ]);
      }

      const client = getClient();
      const result = await client.prompts.create(promptData);

      console.log(chalk.green('✓ Prompt created successfully'));
      console.log(`ID: ${result.data.id}`);
    } catch (error) {
      console.error(chalk.red('Error creating prompt:', error.message));
    }
  });

promptCommand
  .command('execute <id>')
  .description('Execute a prompt')
  .option('-i, --input <text>', 'Input text for the prompt')
  .option('-m, --model <model>', 'LLM model to use', 'gpt-4')
  .option('-d, --documents <ids>', 'Document IDs for RAG (comma-separated)')
  .action(async (id, options) => {
    try {
      const client = getClient();
      
      let input = options.input;
      if (!input) {
        const answer = await inquirer.prompt([
          {
            type: 'editor',
            name: 'input',
            message: 'Enter input for the prompt:'
          }
        ]);
        input = answer.input;
      }

      const executionData = {
        input,
        model: options.model,
        rag_config: options.documents ? {
          document_ids: options.documents.split(',').map(id => id.trim())
        } : undefined
      };

      console.log(chalk.blue('Executing prompt...'));
      const result = await client.prompts.execute(id, executionData);

      console.log(chalk.green('✓ Execution completed'));
      console.log('');
      console.log(chalk.blue('Result:'));
      console.log(result.data.output);
      console.log('');
      console.log(chalk.gray(`Execution ID: ${result.data.execution_id}`));
      console.log(chalk.gray(`Tokens used: ${result.data.usage?.total_tokens || 'N/A'}`));
      console.log(chalk.gray(`Cost: $${result.data.usage?.cost || 'N/A'}`));
    } catch (error) {
      console.error(chalk.red('Error executing prompt:', error.message));
    }
  });

// Document commands
const docCommand = program.command('docs').description('Manage documents');

docCommand
  .command('list')
  .description('List all documents')
  .action(async () => {
    try {
      const client = getClient();
      const documents = await client.documents.list();

      if (documents.data.length === 0) {
        console.log(chalk.yellow('No documents found'));
        return;
      }

      console.log(chalk.blue(`Found ${documents.data.length} documents:`));
      documents.data.forEach(doc => {
        console.log(`  ${chalk.green(doc.id)} - ${doc.filename}`);
        console.log(`    Type: ${doc.type}, Size: ${doc.size} bytes`);
        console.log(`    Status: ${doc.processing_status}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('Error listing documents:', error.message));
    }
  });

docCommand
  .command('upload <file>')
  .description('Upload a document')
  .action(async (filePath) => {
    try {
      const resolvedPath = path.resolve(filePath);
      if (!fs.existsSync(resolvedPath)) {
        console.error(chalk.red('File not found:', resolvedPath));
        return;
      }

      const client = getClient();
      console.log(chalk.blue('Uploading document...'));
      
      const result = await client.documents.upload(resolvedPath);

      console.log(chalk.green('✓ Document uploaded successfully'));
      console.log(`ID: ${result.data.id}`);
      console.log(`Status: ${result.data.processing_status}`);
    } catch (error) {
      console.error(chalk.red('Error uploading document:', error.message));
    }
  });

// Workspace commands
const workspaceCommand = program.command('workspaces').description('Manage workspaces');

workspaceCommand
  .command('list')
  .description('List all workspaces')
  .action(async () => {
    try {
      const client = getClient();
      const workspaces = await client.workspaces.list();

      if (workspaces.data.length === 0) {
        console.log(chalk.yellow('No workspaces found'));
        return;
      }

      console.log(chalk.blue(`Found ${workspaces.data.length} workspaces:`));
      workspaces.data.forEach(workspace => {
        console.log(`  ${chalk.green(workspace.id)} - ${workspace.name}`);
        console.log(`    ${chalk.gray(workspace.description || 'No description')}`);
        console.log(`    Members: ${workspace.member_count}, Role: ${workspace.role}`);
        console.log('');
      });
    } catch (error) {
      console.error(chalk.red('Error listing workspaces:', error.message));
    }
  });

// Initialize and run
loadConfig();

program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
