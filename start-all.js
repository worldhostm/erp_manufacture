#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

const log = (message, color = colors.reset) => {
  const timestamp = new Date().toLocaleTimeString('ko-KR');
  console.log(`${color}[${timestamp}] ${message}${colors.reset}`);
};

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Kill existing processes on common ports
const killPort = (port) => {
  return new Promise((resolve) => {
    const child = spawn('powershell', [
      '-Command',
      `Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }`
    ], { shell: true });
    
    child.on('close', () => {
      log(`🧹 Port ${port} cleaned`, colors.yellow);
      resolve();
    });
  });
};

// Function to start a process
const startProcess = (name, command, args, cwd, color) => {
  return new Promise((resolve, reject) => {
    log(`🚀 Starting ${name}...`, color);
    
    const child = spawn(command, args, {
      cwd: cwd,
      shell: true,
      stdio: 'pipe'
    });

    let started = false;
    
    child.stdout.on('data', (data) => {
      const output = data.toString();
      console.log(`${color}[${name}]${colors.reset} ${output.trim()}`);
      
      // Check if server started successfully
      if ((name === 'BACKEND' && output.includes('Server running on port')) ||
          (name === 'FRONTEND' && output.includes('Ready in'))) {
        if (!started) {
          started = true;
          log(`✅ ${name} started successfully!`, colors.green);
          resolve(child);
        }
      }
    });

    child.stderr.on('data', (data) => {
      const output = data.toString();
      console.log(`${colors.red}[${name}:ERROR]${colors.reset} ${output.trim()}`);
    });

    child.on('close', (code) => {
      log(`❌ ${name} exited with code ${code}`, colors.red);
      if (!started) {
        reject(new Error(`${name} failed to start`));
      }
    });

    child.on('error', (error) => {
      log(`❌ ${name} error: ${error.message}`, colors.red);
      if (!started) {
        reject(error);
      }
    });

    // Set timeout for startup
    setTimeout(() => {
      if (!started) {
        log(`⚠️  ${name} startup timeout`, colors.yellow);
        resolve(child);
      }
    }, 15000);
  });
};

// Main function
async function startDevelopment() {
  console.clear();
  log('🏭 ERP Manufacturing System - Development Mode', colors.bright);
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.cyan);
  
  try {
    // Clean up existing processes
    log('🧹 Cleaning up existing processes...', colors.yellow);
    await Promise.all([
      killPort(3000),
      killPort(3001),
      killPort(8080)
    ]);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Start backend
    const backend = await startProcess(
      'BACKEND',
      'npm',
      ['run', 'dev'],
      path.join(__dirname, 'server'),
      colors.blue
    );
    
    // Wait a bit for backend to fully start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Start frontend
    const frontend = await startProcess(
      'FRONTEND',
      'npm',
      ['run', 'dev'],
      __dirname,
      colors.magenta
    );
    
    // Success message
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    log('🎉 All servers started successfully!', colors.green);
    log('🌐 Frontend: http://localhost:3000 (or 3001)', colors.cyan);
    log('🔧 Backend:  http://localhost:8080', colors.cyan);
    log('🩺 Health:   http://localhost:8080/health', colors.cyan);
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', colors.green);
    log('Press Ctrl+C to stop all servers', colors.yellow);
    
    // Handle process termination
    const cleanup = () => {
      log('🛑 Shutting down servers...', colors.yellow);
      backend.kill('SIGTERM');
      frontend.kill('SIGTERM');
      process.exit(0);
    };
    
    process.on('SIGINT', cleanup);
    process.on('SIGTERM', cleanup);
    
  } catch (error) {
    log(`❌ Failed to start development environment: ${error.message}`, colors.red);
    process.exit(1);
  }
}

// Start the development environment
startDevelopment();