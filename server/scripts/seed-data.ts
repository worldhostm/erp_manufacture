import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import { connectDB } from '../src/config/database';

dotenv.config();
import User from '../src/models/User';
import Company from '../src/models/Company';
import Item from '../src/models/Item';

const seedData = async () => {
  try {
    console.log('🌱 Starting data seeding...');
    
    // Connect to database
    await connectDB();
    
    // Clear existing data
    console.log('🧹 Clearing existing data...');
    await User.deleteMany({});
    await Company.deleteMany({});
    await Item.deleteMany({});
    
    // Create admin user
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash('admin123', 12);
    const adminUser = await User.create({
      name: '시스템 관리자',
      email: 'admin@erp.com',
      password: hashedPassword,
      role: 'ADMIN',
      department: 'IT',
      position: '시스템 관리자',
      phone: '02-1234-5678',
      isActive: true
    });

    // Create manager user
    console.log('👤 Creating manager user...');
    const managerPassword = await bcrypt.hash('manager123', 12);
    const managerUser = await User.create({
      name: '생산 관리자',
      email: 'manager@erp.com',
      password: managerPassword,
      role: 'MANAGER',
      department: '생산부',
      position: '생산관리팀장',
      phone: '02-1234-5679',
      isActive: true
    });

    // Create regular user
    console.log('👤 Creating regular user...');
    const userPassword = await bcrypt.hash('user123', 12);
    const regularUser = await User.create({
      name: '일반 사용자',
      email: 'user@erp.com',
      password: userPassword,
      role: 'USER',
      department: '생산부',
      position: '생산담당자',
      phone: '02-1234-5680',
      isActive: true
    });

    // Create sample companies
    console.log('🏢 Creating sample companies...');
    const companies = await Company.create([
      {
        name: '한국제조(주)',
        type: 'SUPPLIER',
        businessNumber: '123-45-67890',
        address: '서울시 강남구 테헤란로 123',
        phone: '02-1234-5678',
        email: 'info@korea-mfg.co.kr',
        ceo: '김대표',
        contactPerson: '김담당',
        contactPhone: '02-1234-5679',
        contactEmail: 'contact@korea-mfg.co.kr',
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: '글로벌공급(주)',
        type: 'SUPPLIER',
        businessNumber: '234-56-78901',
        address: '부산시 해운대구 센텀로 456',
        phone: '051-1234-5678',
        email: 'info@global-supply.co.kr',
        ceo: '이대표',
        contactPerson: '이담당',
        contactPhone: '051-1234-5679',
        contactEmail: 'contact@global-supply.co.kr',
        createdBy: adminUser._id,
        isActive: true
      },
      {
        name: '품질유통(주)',
        type: 'CUSTOMER',
        businessNumber: '345-67-89012',
        address: '대구시 수성구 동대구로 789',
        phone: '053-1234-5678',
        email: 'info@quality-dist.co.kr',
        ceo: '박대표',
        contactPerson: '박담당',
        contactPhone: '053-1234-5679',
        contactEmail: 'contact@quality-dist.co.kr',
        createdBy: adminUser._id,
        isActive: true
      }
    ]);

    // Create sample items
    console.log('📦 Creating sample items...');
    const items = await Item.create([
      {
        code: 'RAW001',
        name: '스테인리스 스틸 판재',
        category: 'RAW_MATERIAL',
        supplierId: companies[0]._id,
        unit: 'KG',
        price: 25000,
        cost: 24500,
        minStock: 50,
        maxStock: 500,
        safetyStock: 75,
        leadTime: 7,
        specification: 'SUS304 스테인리스 스틸 판재 2mm 두께',
        description: '고품질 스테인리스 스틸 판재',
        weight: 15.7,
        dimensions: {
          length: 2000,
          width: 1000,
          height: 2
        },
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'RAW002',
        name: '알루미늄 봉재',
        category: 'RAW_MATERIAL',
        supplierId: companies[0]._id,
        unit: 'M',
        price: 18000,
        cost: 17800,
        minStock: 30,
        maxStock: 200,
        safetyStock: 40,
        leadTime: 5,
        specification: '6061-T6 알루미늄 봉재 직경 50mm',
        description: '고강도 알루미늄 봉재',
        weight: 12.7,
        dimensions: {
          length: 6000,
          width: 50,
          height: 50
        },
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'COMP001',
        name: '가공 브라켓',
        category: 'COMPONENT',
        unit: 'PCS',
        price: 15000,
        cost: 14800,
        minStock: 100,
        maxStock: 1000,
        safetyStock: 150,
        leadTime: 3,
        specification: 'CNC 가공된 스테인리스 브라켓',
        description: '정밀 가공 브라켓',
        weight: 0.8,
        dimensions: {
          length: 200,
          width: 100,
          height: 50
        },
        createdBy: adminUser._id,
        isActive: true
      },
      {
        code: 'FIN001',
        name: '완제품 어셈블리',
        category: 'FINISHED_PRODUCT',
        unit: 'SET',
        price: 85000,
        cost: 83500,
        minStock: 20,
        maxStock: 200,
        safetyStock: 30,
        leadTime: 10,
        specification: '산업용 스테인리스 어셈블리 완제품',
        description: '고급 완제품 어셈블리',
        weight: 5.2,
        dimensions: {
          length: 500,
          width: 300,
          height: 200
        },
        createdBy: adminUser._id,
        isActive: true
      }
    ]);

    console.log('✅ Data seeding completed successfully!');
    console.log('📊 Created data summary:');
    console.log(`  👤 Users: ${await User.countDocuments()}`);
    console.log(`  🏢 Companies: ${await Company.countDocuments()}`);
    console.log(`  📦 Items: ${await Item.countDocuments()}`);
    console.log('');
    console.log('🔑 Login credentials:');
    console.log('  Admin: admin@erp.com / admin123');
    console.log('  Manager: manager@erp.com / manager123');
    console.log('  User: user@erp.com / user123');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding data:', error);
    process.exit(1);
  }
};

// Run seeding
seedData();