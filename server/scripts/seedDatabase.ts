import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';
import Company from '../src/models/Company';
import Item from '../src/models/Item';

// Database connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/erp_manufacture_dev';
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB Connected Successfully');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await Company.deleteMany({});
    await Item.deleteMany({});
    console.log('🗑️  Cleared existing database data');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

// Create sample users
const createUsers = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    
    const users = [
      {
        name: 'Admin User',
        email: 'admin@erp.com',
        password: await bcrypt.hash('admin123', salt),
        role: 'ADMIN',
        department: 'IT',
        position: 'System Administrator',
        phone: '010-1234-5678',
        isActive: true
      },
      {
        name: 'Production Manager',
        email: 'manager@erp.com',
        password: await bcrypt.hash('manager123', salt),
        role: 'MANAGER',
        department: 'Production',
        position: 'Production Manager',
        phone: '010-2345-6789',
        isActive: true
      },
      {
        name: 'Warehouse Operator',
        email: 'operator@erp.com',
        password: await bcrypt.hash('operator123', salt),
        role: 'USER',
        department: 'Warehouse',
        position: 'Senior Operator',
        phone: '010-3456-7890',
        isActive: true
      },
      {
        name: 'Quality Inspector',
        email: 'quality@erp.com',
        password: await bcrypt.hash('quality123', salt),
        role: 'USER',
        department: 'Quality Assurance',
        position: 'Quality Inspector',
        phone: '010-4567-8901',
        isActive: true
      },
      {
        name: 'Sales Representative',
        email: 'sales@erp.com',
        password: await bcrypt.hash('sales123', salt),
        role: 'USER',
        department: 'Sales',
        position: 'Sales Representative',
        phone: '010-5678-9012',
        isActive: true
      }
    ];

    const createdUsers = await User.insertMany(users);
    console.log(`👥 Created ${createdUsers.length} users`);
    return createdUsers;
  } catch (error) {
    console.error('❌ Error creating users:', error);
    throw error;
  }
};

// Create sample companies
const createCompanies = async (users: any[]) => {
  try {
    const adminUser = users.find(u => u.role === 'ADMIN');
    
    const companies = [
      {
        name: 'Steel Supply Korea',
        businessNumber: '123-45-67890',
        address: 'Seoul, Gangnam-gu, Teheran-ro 123',
        phone: '02-1234-5678',
        email: 'contact@steelsupply.kr',
        ceo: 'Kim Steel',
        type: 'SUPPLIER',
        contactPerson: 'Park Manager',
        contactPhone: '02-1234-5679',
        contactEmail: 'park@steelsupply.kr',
        bankAccount: {
          bankName: 'KB Bank',
          accountNumber: '123-456-789-012',
          accountHolder: 'Steel Supply Korea'
        },
        taxInfo: {
          taxType: 'VAT',
          taxNumber: 'TAX123456789'
        },
        isActive: true,
        notes: 'Primary supplier for raw steel materials. Reliable delivery and quality.',
        createdBy: adminUser._id
      },
      {
        name: 'Motor Tech Industries',
        businessNumber: '234-56-78901',
        address: 'Busan, Haeundae-gu, Marine City 456',
        phone: '051-2345-6789',
        email: 'info@motortech.kr',
        ceo: 'Lee Motor',
        type: 'SUPPLIER',
        contactPerson: 'Choi Engineer',
        contactPhone: '051-2345-6790',
        contactEmail: 'choi@motortech.kr',
        bankAccount: {
          bankName: 'Shinhan Bank',
          accountNumber: '234-567-890-123',
          accountHolder: 'Motor Tech Industries'
        },
        taxInfo: {
          taxType: 'VAT',
          taxNumber: 'TAX234567890'
        },
        isActive: true,
        notes: 'Specialist in electric motors and control systems.',
        createdBy: adminUser._id
      },
      {
        name: 'Global Manufacturing Corp',
        businessNumber: '345-67-89012',
        address: 'Incheon, Yeonsu-gu, Songdo International City 789',
        phone: '032-3456-7890',
        email: 'orders@globalmfg.kr',
        ceo: 'Johnson Smith',
        type: 'CUSTOMER',
        contactPerson: 'Sarah Kim',
        contactPhone: '032-3456-7891',
        contactEmail: 'sarah@globalmfg.kr',
        isActive: true,
        notes: 'Large volume customer. Monthly orders of finished products.',
        createdBy: adminUser._id
      },
      {
        name: 'Universal Trading',
        businessNumber: '456-78-90123',
        address: 'Daegu, Suseong-gu, Dalgubeol-daero 321',
        phone: '053-4567-8901',
        email: 'trade@universal.kr',
        ceo: 'Park Universal',
        type: 'BOTH',
        contactPerson: 'Jung Trader',
        contactPhone: '053-4567-8902',
        contactEmail: 'jung@universal.kr',
        bankAccount: {
          bankName: 'Hana Bank',
          accountNumber: '456-789-012-345',
          accountHolder: 'Universal Trading'
        },
        taxInfo: {
          taxType: 'VAT',
          taxNumber: 'TAX456789012'
        },
        isActive: true,
        notes: 'Both supplier and customer. Good for component trading.',
        createdBy: adminUser._id
      },
      {
        name: 'Chemical Solutions Ltd',
        businessNumber: '567-89-01234',
        address: 'Ulsan, Nam-gu, Industrial Complex 654',
        phone: '052-5678-9012',
        email: 'sales@chemsol.kr',
        ceo: 'Cho Chemical',
        type: 'SUPPLIER',
        contactPerson: 'Lim Scientist',
        contactPhone: '052-5678-9013',
        contactEmail: 'lim@chemsol.kr',
        isActive: true,
        notes: 'Chemical supplier for lubricants and cleaning materials.',
        createdBy: adminUser._id
      }
    ];

    const createdCompanies = await Company.insertMany(companies);
    console.log(`🏢 Created ${createdCompanies.length} companies`);
    return createdCompanies;
  } catch (error) {
    console.error('❌ Error creating companies:', error);
    throw error;
  }
};

// Create sample items
const createItems = async (users: any[], companies: any[]) => {
  try {
    const adminUser = users.find(u => u.role === 'ADMIN');
    const steelSupplier = companies.find(c => c.name === 'Steel Supply Korea');
    const motorSupplier = companies.find(c => c.name === 'Motor Tech Industries');
    const universalTrading = companies.find(c => c.name === 'Universal Trading');
    const chemicalSupplier = companies.find(c => c.name === 'Chemical Solutions Ltd');

    const items = [
      // Raw Materials
      {
        code: 'RAW001',
        name: 'Steel Sheet 10mm',
        category: 'RAW_MATERIAL',
        supplierId: steelSupplier._id,
        unit: 'sheet',
        price: 45000,
        cost: 38000,
        minStock: 50,
        maxStock: 500,
        safetyStock: 25,
        leadTime: 7,
        specification: 'High quality carbon steel sheet, 10mm thickness, 2000x1000mm',
        description: 'Premium grade steel sheet for manufacturing structural components',
        barcode: '8801234567890',
        weight: 157.0,
        dimensions: {
          length: 2000,
          width: 1000,
          height: 10
        },
        storageConditions: 'Dry warehouse, avoid direct moisture contact',
        isActive: true,
        images: ['steel_sheet_10mm_01.jpg', 'steel_sheet_10mm_02.jpg'],
        tags: ['steel', 'raw-material', 'structural'],
        customFields: {
          supplier_code: 'SSK-ST-001',
          grade: 'SS400',
          certification: 'KS D 3503',
          surface_treatment: 'hot rolled'
        },
        createdBy: adminUser._id
      },
      {
        code: 'RAW002',
        name: 'Aluminum Rod 20mm',
        category: 'RAW_MATERIAL',
        supplierId: steelSupplier._id,
        unit: 'meter',
        price: 8500,
        cost: 7200,
        minStock: 200,
        maxStock: 2000,
        safetyStock: 100,
        leadTime: 5,
        specification: 'Aluminum alloy rod, 20mm diameter, 6061-T6 grade',
        description: 'High strength aluminum rod for precision machining',
        barcode: '8801234567891',
        weight: 0.84,
        storageConditions: 'Indoor storage, temperature controlled',
        isActive: true,
        tags: ['aluminum', 'rod', 'machining'],
        customFields: {
          alloy: '6061-T6',
          tensile_strength: '310 MPa',
          yield_strength: '276 MPa'
        },
        createdBy: adminUser._id
      },

      // Components
      {
        code: 'COMP001',
        name: 'AC Motor 5HP 220V',
        category: 'COMPONENT',
        supplierId: motorSupplier._id,
        unit: 'ea',
        price: 450000,
        cost: 380000,
        minStock: 10,
        maxStock: 100,
        safetyStock: 5,
        leadTime: 14,
        specification: '5HP, 220V, 3-phase, 1750 RPM, TEFC enclosure',
        description: 'High efficiency AC motor with variable speed control capability',
        barcode: '8801234567892',
        weight: 45.0,
        dimensions: {
          length: 450,
          width: 300,
          height: 280
        },
        storageConditions: 'Climate controlled warehouse, humidity < 60%',
        expiryDays: 1095, // 3 years warranty
        isActive: true,
        tags: ['motor', 'electric', '5hp', 'industrial'],
        customFields: {
          voltage: '220V',
          power: '5HP',
          rpm: '1750',
          phases: '3',
          efficiency: '92%',
          warranty: '3 years'
        },
        createdBy: adminUser._id
      },
      {
        code: 'COMP002',
        name: 'Precision Bearing 6208',
        category: 'COMPONENT',
        supplierId: universalTrading._id,
        unit: 'ea',
        price: 25000,
        cost: 18000,
        minStock: 50,
        maxStock: 500,
        safetyStock: 25,
        leadTime: 10,
        specification: 'Deep groove ball bearing, 6208 series, sealed',
        description: 'High precision bearing for rotating machinery',
        barcode: '8801234567893',
        weight: 0.32,
        storageConditions: 'Clean, dry environment, protected from dust',
        expiryDays: 1825, // 5 years shelf life
        isActive: true,
        tags: ['bearing', 'precision', 'sealed', '6208'],
        customFields: {
          inner_diameter: '40mm',
          outer_diameter: '80mm',
          width: '18mm',
          load_rating: '25.5 kN'
        },
        createdBy: adminUser._id
      },

      // Finished Products
      {
        code: 'FIN001',
        name: 'Industrial Conveyor Unit Model A',
        category: 'FINISHED_PRODUCT',
        unit: 'ea',
        price: 2500000,
        cost: 1800000,
        minStock: 2,
        maxStock: 20,
        safetyStock: 1,
        leadTime: 30,
        specification: 'Complete conveyor system, 5m length, 500kg capacity',
        description: 'Heavy-duty industrial conveyor for manufacturing lines',
        barcode: '8801234567894',
        weight: 850.0,
        dimensions: {
          length: 5000,
          width: 800,
          height: 1200
        },
        storageConditions: 'Covered outdoor storage acceptable',
        expiryDays: 7300, // 20 years design life
        isActive: true,
        tags: ['conveyor', 'industrial', 'heavy-duty', 'complete'],
        customFields: {
          model: 'CONV-A-5000',
          capacity: '500kg',
          belt_speed: '0.5-2.0 m/s',
          motor_power: '5HP',
          control_system: 'PLC controlled'
        },
        createdBy: adminUser._id
      },
      {
        code: 'FIN002',
        name: 'Precision Machining Center Table',
        category: 'FINISHED_PRODUCT',
        unit: 'ea',
        price: 8500000,
        cost: 6200000,
        minStock: 1,
        maxStock: 5,
        safetyStock: 0,
        leadTime: 45,
        specification: 'CNC machining table with precision positioning system',
        description: 'High-precision machining table for aerospace components',
        barcode: '8801234567895',
        weight: 2500.0,
        dimensions: {
          length: 2500,
          width: 1500,
          height: 800
        },
        storageConditions: 'Climate controlled facility, vibration isolated',
        expiryDays: 10950, // 30 years design life
        isActive: true,
        tags: ['machining', 'precision', 'cnc', 'aerospace'],
        customFields: {
          model: 'MCT-P-2500',
          positioning_accuracy: '±0.002mm',
          table_size: '2500x1500mm',
          max_load: '5000kg',
          control_axes: '5-axis'
        },
        createdBy: adminUser._id
      },

      // Consumables
      {
        code: 'CON001',
        name: 'Industrial Lubricant Oil 15W-40',
        category: 'CONSUMABLE',
        supplierId: chemicalSupplier._id,
        unit: 'liter',
        price: 15000,
        cost: 12000,
        minStock: 100,
        maxStock: 1000,
        safetyStock: 50,
        leadTime: 3,
        specification: 'Premium grade industrial lubricant oil, SAE 15W-40',
        description: 'Multi-grade lubricant for industrial machinery and equipment',
        barcode: '8801234567896',
        weight: 0.88,
        storageConditions: 'Cool, dry place away from heat sources and ignition',
        expiryDays: 1095, // 3 years shelf life
        isActive: true,
        tags: ['lubricant', 'oil', 'industrial', '15w40'],
        customFields: {
          viscosity: '15W-40',
          flash_point: '230°C',
          pour_point: '-30°C',
          msds_available: true,
          un_number: 'UN3082'
        },
        createdBy: adminUser._id
      },
      {
        code: 'CON002',
        name: 'Cutting Fluid Concentrate',
        category: 'CONSUMABLE',
        supplierId: chemicalSupplier._id,
        unit: 'liter',
        price: 35000,
        cost: 28000,
        minStock: 50,
        maxStock: 500,
        safetyStock: 25,
        leadTime: 7,
        specification: 'Water-soluble cutting fluid concentrate, 1:20 dilution ratio',
        description: 'High-performance cutting fluid for precision machining operations',
        barcode: '8801234567897',
        weight: 1.02,
        storageConditions: 'Temperature 5-35°C, protect from freezing',
        expiryDays: 730, // 2 years shelf life
        isActive: true,
        tags: ['cutting-fluid', 'machining', 'concentrate', 'water-soluble'],
        customFields: {
          dilution_ratio: '1:20',
          ph_range: '8.5-9.5',
          biocide_free: true,
          chlorine_free: true,
          application: 'milling, turning, drilling'
        },
        createdBy: adminUser._id
      },
      {
        code: 'CON003',
        name: 'Industrial Cleaning Solvent',
        category: 'CONSUMABLE',
        supplierId: chemicalSupplier._id,
        unit: 'liter',
        price: 22000,
        cost: 17000,
        minStock: 30,
        maxStock: 300,
        safetyStock: 15,
        leadTime: 5,
        specification: 'Multi-purpose industrial cleaning solvent, non-toxic',
        description: 'Effective degreasing and cleaning solvent for manufacturing equipment',
        barcode: '8801234567898',
        weight: 0.78,
        storageConditions: 'Ventilated storage, away from heat and ignition sources',
        expiryDays: 1460, // 4 years shelf life
        isActive: true,
        tags: ['cleaning', 'solvent', 'degreasing', 'non-toxic'],
        customFields: {
          flash_point: '> 60°C',
          biodegradable: true,
          voc_content: 'low',
          application: 'degreasing, cleaning, maintenance'
        },
        createdBy: adminUser._id
      }
    ];

    const createdItems = await Item.insertMany(items);
    console.log(`📦 Created ${createdItems.length} items`);
    return createdItems;
  } catch (error) {
    console.error('❌ Error creating items:', error);
    throw error;
  }
};

// Main seeding function
const seedDatabase = async () => {
  console.log('🌱 Starting database seeding process...');
  
  try {
    await connectDB();
    await clearDatabase();
    
    const users = await createUsers();
    const companies = await createCompanies(users);
    const items = await createItems(users, companies);

    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   👥 Users: ${users.length}`);
    console.log(`   🏢 Companies: ${companies.length}`);
    console.log(`   📦 Items: ${items.length}`);
    
    console.log('\n🔑 Test Login Credentials:');
    console.log('   Admin: admin@erp.com / admin123');
    console.log('   Manager: manager@erp.com / manager123');
    console.log('   User: operator@erp.com / operator123');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

// Run seeding if called directly
if (require.main === module) {
  seedDatabase();
}

export default seedDatabase;