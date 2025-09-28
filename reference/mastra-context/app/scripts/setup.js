#!/usr/bin/env node

import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';

const REQUIRED_ENV_VARS = [
  'OPENAI_API_KEY',
  'DATABASE_URL',
];

const OPTIONAL_ENV_VARS = [
  'NODE_ENV',
  'PORT',
  'LOG_LEVEL',
  'GITHUB_TOKEN',
  'SLACK_BOT_TOKEN',
];

async function setup() {
  console.log('🚀 Setting up your Mastra application...\n');

  // Check if .env file exists
  const envPath = '.env';
  const envExamplePath = '.env.example';

  try {
    await fs.access(envPath);
    console.log('✅ .env file already exists');
  } catch {
    try {
      await fs.copyFile(envExamplePath, envPath);
      console.log('📋 Created .env file from .env.example');
      console.log('⚠️  Please update .env with your actual configuration values\n');
    } catch (error) {
      console.error('❌ Failed to create .env file:', error.message);
      process.exit(1);
    }
  }

  // Check environment variables
  console.log('🔍 Checking environment configuration...');

  // Load environment variables
  try {
    const envContent = await fs.readFile(envPath, 'utf-8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value && !line.startsWith('#')) {
        envVars[key.trim()] = value.trim();
      }
    });

    // Check required variables
    const missing = REQUIRED_ENV_VARS.filter(key =>
      !envVars[key] || envVars[key].includes('your_') || envVars[key].includes('_here')
    );

    if (missing.length > 0) {
      console.log('⚠️  Missing or placeholder values for required environment variables:');
      missing.forEach(key => console.log(`   - ${key}`));
      console.log('\n💡 Please update these in your .env file before running the application\n');
    } else {
      console.log('✅ All required environment variables are configured\n');
    }

  } catch (error) {
    console.error('❌ Failed to read .env file:', error.message);
  }

  // Create database directory if using SQLite
  try {
    const dbDir = path.dirname('./mastra.db');
    await fs.mkdir(dbDir, { recursive: true });
    console.log('📁 Database directory ready');
  } catch (error) {
    console.log('⚠️  Could not create database directory:', error.message);
  }

  // Install dependencies if node_modules doesn't exist
  try {
    await fs.access('node_modules');
    console.log('✅ Dependencies already installed');
  } catch {
    console.log('📦 Installing dependencies...');
    try {
      execSync('npm install', { stdio: 'inherit' });
      console.log('✅ Dependencies installed successfully');
    } catch (error) {
      console.error('❌ Failed to install dependencies:', error.message);
      process.exit(1);
    }
  }

  console.log('\n🎉 Setup complete! Next steps:');
  console.log('   1. Update your .env file with actual configuration values');
  console.log('   2. Run "npm run dev" to start development server');
  console.log('   3. Visit http://localhost:3000/docs to see API documentation');
  console.log('   4. Check out the examples in src/mastra/ to get started\n');
}

setup().catch(error => {
  console.error('❌ Setup failed:', error.message);
  process.exit(1);
});