#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file path
const logFile = path.join(logsDir, `server-${new Date().toISOString().split('T')[0]}.log`);

console.log('🚀 ERP Manufacturing System Server 시작');
console.log('📝 로그 파일:', logFile);
console.log('🔗 서버 주소: http://localhost:8080');
console.log('📊 Health Check: http://localhost:8080/health');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

// Start the server
const child = spawn('npm', ['run', 'dev'], {
  stdio: ['inherit', 'pipe', 'pipe'],
  shell: true,
  cwd: path.join(__dirname, '..')
});

// Create write streams for logging
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

// Function to write timestamped logs
const writeLog = (data, type = 'INFO') => {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${type}] ${data}`;
  console.log(logLine);
  logStream.write(logLine + '\n');
};

// Handle stdout
child.stdout.on('data', (data) => {
  writeLog(data.toString().trim(), 'STDOUT');
});

// Handle stderr
child.stderr.on('data', (data) => {
  writeLog(data.toString().trim(), 'STDERR');
});

// Handle process exit
child.on('close', (code) => {
  const message = `서버가 종료되었습니다. 종료 코드: ${code}`;
  writeLog(message, 'EXIT');
  logStream.end();
  process.exit(code);
});

// Handle process errors
child.on('error', (error) => {
  const message = `서버 실행 오류: ${error.message}`;
  writeLog(message, 'ERROR');
  logStream.end();
  process.exit(1);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n⚠️  서버를 종료합니다...');
  child.kill('SIGINT');
});

process.on('SIGTERM', () => {
  console.log('\n⚠️  서버를 종료합니다...');
  child.kill('SIGTERM');
});