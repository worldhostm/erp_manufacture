import request from 'supertest';
import app from '../src/index';
import { Company } from '../src/models/Company';

describe('Company Routes', () => {
  let token: string;
  
  beforeEach(async () => {
    // Register and login to get auth token
    const userData = {
      email: 'company@example.com',
      password: 'password123',
      name: '회사 관리자',
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
  });

  describe('POST /api/companies', () => {
    it('should create a new company successfully', async () => {
      const companyData = {
        name: '테스트 협력사',
        type: 'supplier',
        businessNumber: '123-45-67890',
        address: '서울시 강남구 테스트로 123',
        phone: '02-1234-5678',
        email: 'test@company.com',
        manager: '홍길동',
        status: 'active'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData)
        .expect(201);

      expect(response.body).toHaveProperty('message', '협력사가 성공적으로 등록되었습니다');
      expect(response.body).toHaveProperty('company');
      expect(response.body.company).toHaveProperty('name', companyData.name);
      expect(response.body.company).toHaveProperty('type', companyData.type);
      expect(response.body.company).toHaveProperty('businessNumber', companyData.businessNumber);
    });

    it('should fail without authentication', async () => {
      const companyData = {
        name: '테스트 협력사',
        type: 'supplier',
        businessNumber: '123-45-67890'
      };

      const response = await request(app)
        .post('/api/companies')
        .send(companyData)
        .expect(401);

      expect(response.body).toHaveProperty('message', '토큰이 제공되지 않았습니다');
    });

    it('should fail with duplicate business number', async () => {
      const companyData = {
        name: '테스트 협력사1',
        type: 'supplier',
        businessNumber: '999-99-99999',
        address: '서울시 강남구 테스트로 123',
        phone: '02-1234-5678'
      };

      // Create first company
      await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData)
        .expect(201);

      // Try to create duplicate
      const duplicateData = {
        ...companyData,
        name: '테스트 협력사2'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(duplicateData)
        .expect(400);

      expect(response.body).toHaveProperty('message', '이미 등록된 사업자번호입니다');
    });
  });

  describe('GET /api/companies', () => {
    beforeEach(async () => {
      // Create test companies
      const companies = [
        {
          name: '공급업체1',
          type: 'supplier',
          businessNumber: '111-11-11111',
          address: '서울시 강남구',
          phone: '02-1111-1111'
        },
        {
          name: '고객사1',
          type: 'customer',
          businessNumber: '222-22-22222',
          address: '서울시 서초구',
          phone: '02-2222-2222'
        }
      ];

      for (const company of companies) {
        await request(app)
          .post('/api/companies')
          .set('Authorization', `Bearer ${token}`)
          .send(company);
      }
    });

    it('should return all companies', async () => {
      const response = await request(app)
        .get('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty('name');
      expect(response.body[0]).toHaveProperty('type');
    });

    it('should filter companies by type', async () => {
      const response = await request(app)
        .get('/api/companies?type=supplier')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toHaveProperty('type', 'supplier');
    });
  });

  describe('GET /api/companies/:id', () => {
    let companyId: string;

    beforeEach(async () => {
      const companyData = {
        name: '상세조회 테스트',
        type: 'supplier',
        businessNumber: '333-33-33333',
        address: '서울시 강남구',
        phone: '02-3333-3333'
      };

      const response = await request(app)
        .post('/api/companies')
        .set('Authorization', `Bearer ${token}`)
        .send(companyData);

      companyId = response.body.company._id;
    });

    it('should return company details', async () => {
      const response = await request(app)
        .get(`/api/companies/${companyId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('name', '상세조회 테스트');
      expect(response.body).toHaveProperty('type', 'supplier');
    });

    it('should return 404 for non-existent company', async () => {
      const fakeId = '507f1f77bcf86cd799439011';
      const response = await request(app)
        .get(`/api/companies/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);

      expect(response.body).toHaveProperty('message', '협력사를 찾을 수 없습니다');
    });
  });
});