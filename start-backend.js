const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Backend (Node.js + Express)...');

// Change to server directory
const serverPath = path.join(__dirname, 'server');
process.chdir(serverPath);

// Start backend server
const backend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

backend.on('error', (err) => {
  console.error('❌ Failed to start backend:', err);
  process.exit(1);
});

backend.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Backend process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down backend...');
  backend.kill('SIGINT');
});