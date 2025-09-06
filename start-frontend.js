const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 Starting Frontend (Next.js)...');

// Change to project root directory
process.chdir(__dirname);

// Start Next.js development server
const frontend = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: { ...process.env }
});

frontend.on('error', (err) => {
  console.error('❌ Failed to start frontend:', err);
  process.exit(1);
});

frontend.on('close', (code) => {
  if (code !== 0) {
    console.error(`❌ Frontend process exited with code ${code}`);
  }
  process.exit(code);
});

// Handle Ctrl+C gracefully
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down frontend...');
  frontend.kill('SIGINT');
});