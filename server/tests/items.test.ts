import request from 'supertest';
import app from '../src/index';
import { Item } from '../src/models/Item';
import { Company } from '../src/models/Company';

describe('Item Routes', () => {
  let token: string;
  let supplierId: string;

  beforeEach(async () => {
    // Register and login to get auth token
    const userData = {
      email: 'item@example.com',
      password: 'password123',
      name: '품목 관리자',
      role: 'admin'
    };

    await request(app)
      .post('/api/auth/register')
      .send(userData);

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    token = loginResponse.body.token;

    // Create a test supplier
    const supplierResponse = await request(app)
      .post('/api/companies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: '테스트 공급업체',
        type: 'supplier',
        businessNumber: '444-44-44444',
        address: '서울시 강남구',
        phone: '02-4444-4444'
      });

    supplierId = supplierResponse.body.company._id;
  });

  describe('POST /api/items', () => {
    it('should create a new item successfully', async () => {
      const itemData = {
        code: 'ITM001',
        name: '테스트 부품',
        category: 'component',
        type: 'purchase',
        unit: 'EA',
        price: 1000,
        supplier: supplierId,
        minStock: 10,
        maxStock: 100,
        currentStock: 50,
        location: 'A-01-01',
        description: '테스트용 부품입니다',
        specifications: {
          material: '스틸',
          weight: 0.5,
          dimensions: '10x10x5'
        },
        status: 'active'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send(itemData)
        .expect(201);

      expect(response.body).toHaveProperty('message', '품목이 성공적으로 등록되었습니다');
      expect(response.body).toHaveProperty('item');
      expect(response.body.item).toHaveProperty('code', itemData.code);
      expect(response.body.item).toHaveProperty('name', itemData.name);
      expect(response.body.item).toHaveProperty('supplier', supplierId);
    });

    it('should fail without authentication', async () => {
      const itemData = {
        code: 'ITM002',
        name: '테스트 부품2',
        category: 'component',
        type: 'purchase',
        unit: 'EA',
        price: 2000
      };

      const response = await request(app)
        .post('/api/items')
        .send(itemData)
        .expect(401);

      expect(response.body).toHaveProperty('message', '토큰이 제공되지 않았습니다');
    });

    it('should fail with duplicate item code', async () => {
      const itemData = {
        code: 'DUPLICATE001',
        name: '중복 테스트',
        category: 'component',
        type: 'purchase',
        unit: 'EA',
        price: 1500,
        supplier: supplierId
      };

      // Create first item
      await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send(itemData)
        .expect(201);

      // Try to create duplicate
      const duplicateData = {
        ...itemData,
        name: '중복 테스트2'
      };

      const response = await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('message', '이미 등록된 품목코드입니다');
    });
  });

  describe('GET /api/items', () => {
    beforeEach(async () => {
      // Create test items
      const items = [
        {
          code: 'ITM100',
          name: '부품A',
          category: 'component',
          type: 'purchase',
          unit: 'EA',
          price: 1000,
          supplier: supplierId,
          currentStock: 50
        },
        {
          code: 'ITM101',
          name: '부품B',
          category: 'component',
          type: 'manufacture',
          unit: 'EA',
          price: 2000,
          currentStock: 30
        }
      ];

      for (const item of items) {
        await request(app)
          .post('/api/items')
          .set('Authorization', `Bearer ${token}`)
          .send(item);
      }
    });

    it('should return all items', async () => {
      const response = await request(app)
        .get('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('name');
    });

    it('should filter items by supplier', async () => {
      const response = await request(app)
        .get(`/api/items?supplier=${supplierId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('supplier', supplierId);
    });

    it('should filter items by category', async () => {
      const response = await request(app)
        .get('/api/items?category=component')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      response.body.forEach((item: any) => {
        expect(item).toHaveProperty('category', 'component');
      });
    });
  });

  describe('GET /api/items/by-supplier/:supplierId', () => {
    beforeEach(async () => {
      // Create items for specific supplier
      await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'SUPP001',
          name: '공급업체 전용 부품',
          category: 'component',
          type: 'purchase',
          unit: 'EA',
          price: 1500,
          supplier: supplierId,
          currentStock: 25
        });
    });

    it('should return items for specific supplier', async () => {
      const response = await request(app)
        .get(`/api/items/by-supplier/${supplierId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('supplier', supplierId);
      expect(response.body[0]).toHaveProperty('name', '공급업체 전용 부품');
    });

    it('should return empty array for supplier with no items', async () => {
      // Create another supplier
      const anotherSupplierResponse = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send({
          name: '빈 공급업체',
          type: 'supplier',
          businessNumber: '555-55-55555',
          address: '서울시 서초구',
          phone: '02-5555-5555'
        });

      const emptySupplierId = anotherSupplierResponse.body.company._id;

      const response = await request(app)
        .get(`/api/items/by-supplier/${emptySupplierId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });
  });

  describe('GET /api/items/dropdown/list', () => {
    beforeEach(async () => {
      await request(app)
        .post('/api/items')
        .set('Authorization', `Bearer ${token}`)
        .send({
          code: 'DROP001',
          name: '드롭다운 테스트',
          category: 'component',
          type: 'purchase',
          unit: 'EA',
          price: 800,
          supplier: supplierId,
          currentStock: 15
        });
    });

    it('should return simplified item list for dropdown', async () => {
      const response = await request(app)
        .get('/api/items/dropdown/list')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('_id');
      expect(response.body[0]).toHaveProperty('code');
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('unit');
    });
  });
});