import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { connectDB } from './config/database';
import { errorHandler } from './middleware/errorHandler';

// Set UTF-8 encoding for Node.js process
process.env.LC_ALL = 'C.UTF-8';
process.env.LANG = 'C.UTF-8';

// Routes
import authRoutes from './routes/auth';
import companyRoutes from './routes/companies';
import supplierRoutes from './routes/suppliers';
import adminRoutes from './routes/admin';
import itemRoutes from './routes/items';
import purchaseRoutes from './routes/purchase';
import inventoryRoutes from './routes/inventory';
import productionRoutes from './routes/production';
import qualityRoutes from './routes/quality';
import salesRoutes from './routes/sales';
import reportsRoutes from './routes/reports';
import employeeRoutes from './routes/employee';
import purchaseRequestRoutes from './routes/purchase-request';
import receiptRoutes from './routes/receipt';
import dashboardRoutes from './routes/dashboard';
import qualityInspectionRoutes from './routes/quality-inspection';
import workOrderRoutes from './routes/work-orders';
import productionPlanRoutes from './routes/production-plans';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});

// Middleware
app.use(helmet());
app.use(limiter);
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  
  // Override res.json to ensure UTF-8 encoding
  const originalJson = res.json;
  res.json = function(body: any) {
    return originalJson.call(this, body);
  };
  
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/purchase', purchaseRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/production', productionRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/purchase-requests', purchaseRequestRoutes);
app.use('/api/receipts', receiptRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/quality-inspections', qualityInspectionRoutes);
app.use('/api/work-orders', workOrderRoutes);
app.use('/api/production-plans', productionPlanRoutes);

// Error handling
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    message: 'Route not found',
    path: req.originalUrl 
  });
});

// Connect to database and start server
const startServer = async () => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

export default app;