import mongoose from 'mongoose';
import Company, { ICompany } from '../../src/models/Company';
import { testUsers, testCompanies, invalidTestData } from '../fixtures/testData';
import '../setup';

describe('Company Database Operations', () => {
  let testUser: any;
  
  beforeEach(async () => {
    // Create a test user for createdBy field
    testUser = { _id: new mongoose.Types.ObjectId() };
  });

  describe('CREATE Operations', () => {
    it('should create a valid supplier company', async () => {
      const companyData = {
        ...testCompanies[0],
        createdBy: testUser._id
      };
      
      const company = await Company.create(companyData);
      
      expect(company).toBeDefined();
      expect(company.name).toBe(testCompanies[0].name);
      expect(company.type).toBe('SUPPLIER');
      expect(company.businessNumber).toBe(testCompanies[0].businessNumber);
      expect(company.isActive).toBe(true);
      expect(company.createdBy).toEqual(testUser._id);
      expect(company.createdAt).toBeDefined();
      expect(company.updatedAt).toBeDefined();
    });

    it('should create a valid customer company', async () => {
      const companyData = {
        ...testCompanies[1],
        createdBy: testUser._id
      };
      
      const company = await Company.create(companyData);
      
      expect(company).toBeDefined();
      expect(company.name).toBe(testCompanies[1].name);
      expect(company.type).toBe('CUSTOMER');
      expect(company.isActive).toBe(true);
    });

    it('should create a company with type BOTH', async () => {
      const companyData = {
        ...testCompanies[2],
        createdBy: testUser._id
      };
      
      const company = await Company.create(companyData);
      
      expect(company).toBeDefined();
      expect(company.type).toBe('BOTH');
    });

    it('should create a company with minimal required fields', async () => {
      const minimalCompany = {
        name: 'Minimal Company',
        type: 'SUPPLIER',
        createdBy: testUser._id
      };
      
      const company = await Company.create(minimalCompany);
      
      expect(company).toBeDefined();
      expect(company.name).toBe('Minimal Company');
      expect(company.type).toBe('SUPPLIER');
      expect(company.isActive).toBe(true);
    });

    it('should create a company with bank account information', async () => {
      const companyWithBank = {
        name: 'Bank Test Company',
        type: 'SUPPLIER',
        createdBy: testUser._id,
        bankAccount: {
          bankName: 'Test Bank',
          accountNumber: '123-456-789',
          accountHolder: 'Bank Test Company'
        }
      };
      
      const company = await Company.create(companyWithBank);
      
      expect(company.bankAccount).toBeDefined();
      expect(company.bankAccount?.bankName).toBe('Test Bank');
      expect(company.bankAccount?.accountNumber).toBe('123-456-789');
      expect(company.bankAccount?.accountHolder).toBe('Bank Test Company');
    });

    it('should create a company with tax information', async () => {
      const companyWithTax = {
        name: 'Tax Test Company',
        type: 'CUSTOMER',
        createdBy: testUser._id,
        taxInfo: {
          taxType: 'VAT',
          taxNumber: 'TAX123456'
        }
      };
      
      const company = await Company.create(companyWithTax);
      
      expect(company.taxInfo).toBeDefined();
      expect(company.taxInfo?.taxType).toBe('VAT');
      expect(company.taxInfo?.taxNumber).toBe('TAX123456');
    });

    it('should fail to create company without required name field', async () => {
      const invalidCompany = {
        type: 'SUPPLIER',
        createdBy: testUser._id
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow('Company name is required');
    });

    it('should fail to create company without required type field', async () => {
      const invalidCompany = {
        name: 'No Type Company',
        createdBy: testUser._id
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow('Company type is required');
    });

    it('should fail to create company without createdBy field', async () => {
      const invalidCompany = {
        name: 'No Creator Company',
        type: 'SUPPLIER'
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow();
    });

    it('should fail to create company with invalid business number format', async () => {
      const invalidCompany = {
        name: 'Invalid Business Number Company',
        type: 'SUPPLIER',
        businessNumber: invalidTestData.company.invalidBusinessNumber.businessNumber,
        createdBy: testUser._id
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow('Business number format should be XXX-XX-XXXXX');
    });

    it('should fail to create company with invalid email', async () => {
      const invalidCompany = {
        name: 'Invalid Email Company',
        type: 'SUPPLIER',
        email: invalidTestData.company.invalidEmail.email,
        createdBy: testUser._id
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow('Please enter a valid email');
    });

    it('should fail to create company with invalid type', async () => {
      const invalidCompany = {
        name: 'Invalid Type Company',
        type: 'INVALID_TYPE',
        createdBy: testUser._id
      };
      
      await expect(Company.create(invalidCompany))
        .rejects
        .toThrow();
    });

    it('should prevent creating companies with duplicate names', async () => {
      const companyData = {
        name: 'Duplicate Company',
        type: 'SUPPLIER',
        createdBy: testUser._id
      };
      
      await Company.create(companyData);
      
      await expect(Company.create(companyData))
        .rejects
        .toThrow();
    });
  });

  describe('READ Operations', () => {
    let createdCompanies: ICompany[];

    beforeEach(async () => {
      // Create test companies
      createdCompanies = await Promise.all(
        testCompanies.map(company => 
          Company.create({
            ...company,
            createdBy: testUser._id
          })
        )
      );
    });

    it('should find all companies', async () => {
      const companies = await Company.find();
      
      expect(companies).toHaveLength(3);
    });

    it('should find companies by type SUPPLIER', async () => {
      const suppliers = await Company.find({ type: 'SUPPLIER' });
      
      expect(suppliers).toHaveLength(1);
      expect(suppliers[0].type).toBe('SUPPLIER');
    });

    it('should find companies by type CUSTOMER', async () => {
      const customers = await Company.find({ type: 'CUSTOMER' });
      
      expect(customers).toHaveLength(1);
      expect(customers[0].type).toBe('CUSTOMER');
    });

    it('should find companies by type BOTH', async () => {
      const both = await Company.find({ type: 'BOTH' });
      
      expect(both).toHaveLength(1);
      expect(both[0].type).toBe('BOTH');
    });

    it('should find active companies only', async () => {
      // Deactivate one company
      await Company.findByIdAndUpdate(createdCompanies[0]._id, { isActive: false });
      
      const activeCompanies = await Company.find({ isActive: true });
      
      expect(activeCompanies).toHaveLength(2);
    });

    it('should find company by name using regex search', async () => {
      const companies = await Company.find({
        name: { $regex: 'ABC', $options: 'i' }
      });
      
      expect(companies).toHaveLength(1);
      expect(companies[0].name).toContain('ABC');
    });

    it('should find company by business number', async () => {
      const companies = await Company.find({
        businessNumber: testCompanies[0].businessNumber
      });
      
      expect(companies).toHaveLength(1);
      expect(companies[0].businessNumber).toBe(testCompanies[0].businessNumber);
    });

    it('should find company by id', async () => {
      const company = await Company.findById(createdCompanies[0]._id);
      
      expect(company).toBeDefined();
      expect(company!._id.toString()).toBe(createdCompanies[0]._id.toString());
    });

    it('should return null for non-existent company id', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const company = await Company.findById(nonExistentId);
      
      expect(company).toBeNull();
    });

    it('should find companies with pagination', async () => {
      const page1 = await Company.find().limit(2).skip(0);
      const page2 = await Company.find().limit(2).skip(2);
      
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(1);
    });

    it('should sort companies by name ascending', async () => {
      const companies = await Company.find().sort({ name: 1 });
      
      expect(companies[0].name).toBe('ABC Supplier');
      expect(companies[1].name).toBe('Universal Corp');
      expect(companies[2].name).toBe('XYZ Customer');
    });

    it('should sort companies by creation date descending', async () => {
      const companies = await Company.find().sort({ createdAt: -1 });
      
      expect(companies).toHaveLength(3);
      // Latest created should be first
      expect(companies[0].createdAt.getTime()).toBeGreaterThanOrEqual(
        companies[1].createdAt.getTime()
      );
    });
  });

  describe('UPDATE Operations', () => {
    let testCompany: ICompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        ...testCompanies[0],
        createdBy: testUser._id
      });
    });

    it('should update company name', async () => {
      const updatedName = 'Updated Company Name';
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { name: updatedName },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany).toBeDefined();
      expect(updatedCompany!.name).toBe(updatedName);
      expect(updatedCompany!.updatedAt.getTime()).toBeGreaterThan(
        testCompany.createdAt.getTime()
      );
    });

    it('should update company type from SUPPLIER to BOTH', async () => {
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { type: 'BOTH' },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.type).toBe('BOTH');
    });

    it('should update company business number', async () => {
      const newBusinessNumber = '999-99-99999';
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { businessNumber: newBusinessNumber },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.businessNumber).toBe(newBusinessNumber);
    });

    it('should update company contact information', async () => {
      const updateData = {
        phone: '02-9999-9999',
        email: 'updated@company.com',
        contactPerson: 'Updated Contact',
        contactPhone: '02-9999-9998',
        contactEmail: 'contact@updated.com'
      };
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.phone).toBe(updateData.phone);
      expect(updatedCompany!.email).toBe(updateData.email);
      expect(updatedCompany!.contactPerson).toBe(updateData.contactPerson);
      expect(updatedCompany!.contactPhone).toBe(updateData.contactPhone);
      expect(updatedCompany!.contactEmail).toBe(updateData.contactEmail);
    });

    it('should update bank account information', async () => {
      const newBankAccount = {
        bankName: 'Updated Bank',
        accountNumber: '999-999-999',
        accountHolder: 'Updated Holder'
      };
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { bankAccount: newBankAccount },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.bankAccount).toEqual(newBankAccount);
    });

    it('should update tax information', async () => {
      const newTaxInfo = {
        taxType: 'Corporate Tax',
        taxNumber: 'TAX999999'
      };
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { taxInfo: newTaxInfo },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.taxInfo).toEqual(newTaxInfo);
    });

    it('should soft delete company by setting isActive to false', async () => {
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { isActive: false },
        { new: true }
      );
      
      expect(updatedCompany!.isActive).toBe(false);
    });

    it('should update notes field', async () => {
      const newNotes = 'Updated notes for the company';
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        { notes: newNotes },
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.notes).toBe(newNotes);
    });

    it('should fail to update with invalid business number format', async () => {
      await expect(
        Company.findByIdAndUpdate(
          testCompany._id,
          { businessNumber: '123-456-789' }, // Invalid format
          { new: true, runValidators: true }
        )
      ).rejects.toThrow('Business number format should be XXX-XX-XXXXX');
    });

    it('should fail to update with invalid email', async () => {
      await expect(
        Company.findByIdAndUpdate(
          testCompany._id,
          { email: 'invalid-email' },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow('Please enter a valid email');
    });

    it('should fail to update with invalid type', async () => {
      await expect(
        Company.findByIdAndUpdate(
          testCompany._id,
          { type: 'INVALID_TYPE' },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow();
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'Multi Update Company',
        type: 'BOTH',
        phone: '02-8888-8888',
        email: 'multi@update.com',
        notes: 'Multiple fields updated'
      };
      
      const updatedCompany = await Company.findByIdAndUpdate(
        testCompany._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      expect(updatedCompany!.name).toBe(updateData.name);
      expect(updatedCompany!.type).toBe(updateData.type);
      expect(updatedCompany!.phone).toBe(updateData.phone);
      expect(updatedCompany!.email).toBe(updateData.email);
      expect(updatedCompany!.notes).toBe(updateData.notes);
    });
  });

  describe('DELETE Operations', () => {
    let testCompany: ICompany;

    beforeEach(async () => {
      testCompany = await Company.create({
        ...testCompanies[0],
        createdBy: testUser._id
      });
    });

    it('should hard delete a company', async () => {
      await Company.findByIdAndDelete(testCompany._id);
      
      const deletedCompany = await Company.findById(testCompany._id);
      expect(deletedCompany).toBeNull();
    });

    it('should soft delete a company by setting isActive to false', async () => {
      await Company.findByIdAndUpdate(testCompany._id, { isActive: false });
      
      const softDeletedCompany = await Company.findById(testCompany._id);
      expect(softDeletedCompany).toBeDefined();
      expect(softDeletedCompany!.isActive).toBe(false);
    });

    it('should delete multiple companies by filter', async () => {
      // Create multiple test companies
      await Company.create({
        name: 'Delete Test 1',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
      await Company.create({
        name: 'Delete Test 2',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
      
      const deleteResult = await Company.deleteMany({ type: 'SUPPLIER' });
      
      expect(deleteResult.deletedCount).toBeGreaterThanOrEqual(2);
      
      const remainingSuppliers = await Company.find({ type: 'SUPPLIER' });
      expect(remainingSuppliers).toHaveLength(0);
    });

    it('should handle deletion of non-existent company gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const result = await Company.findByIdAndDelete(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe('Complex Queries and Aggregation', () => {
    beforeEach(async () => {
      // Create multiple companies for testing
      await Promise.all([
        Company.create({
          name: 'Active Supplier 1',
          type: 'SUPPLIER',
          isActive: true,
          createdBy: testUser._id
        }),
        Company.create({
          name: 'Active Supplier 2',
          type: 'SUPPLIER',
          isActive: true,
          createdBy: testUser._id
        }),
        Company.create({
          name: 'Inactive Supplier',
          type: 'SUPPLIER',
          isActive: false,
          createdBy: testUser._id
        }),
        Company.create({
          name: 'Active Customer 1',
          type: 'CUSTOMER',
          isActive: true,
          createdBy: testUser._id
        }),
        Company.create({
          name: 'Both Type Company',
          type: 'BOTH',
          isActive: true,
          createdBy: testUser._id
        })
      ]);
    });

    it('should count companies by type', async () => {
      const supplierCount = await Company.countDocuments({ type: 'SUPPLIER' });
      const customerCount = await Company.countDocuments({ type: 'CUSTOMER' });
      const bothCount = await Company.countDocuments({ type: 'BOTH' });
      
      expect(supplierCount).toBe(3); // 2 active + 1 inactive
      expect(customerCount).toBe(1);
      expect(bothCount).toBe(1);
    });

    it('should count active companies only', async () => {
      const activeCount = await Company.countDocuments({ isActive: true });
      const inactiveCount = await Company.countDocuments({ isActive: false });
      
      expect(activeCount).toBe(4);
      expect(inactiveCount).toBe(1);
    });

    it('should find companies that can be suppliers (SUPPLIER or BOTH)', async () => {
      const suppliers = await Company.find({
        type: { $in: ['SUPPLIER', 'BOTH'] },
        isActive: true
      });
      
      expect(suppliers).toHaveLength(3); // 2 SUPPLIER + 1 BOTH
    });

    it('should find companies that can be customers (CUSTOMER or BOTH)', async () => {
      const customers = await Company.find({
        type: { $in: ['CUSTOMER', 'BOTH'] },
        isActive: true
      });
      
      expect(customers).toHaveLength(2); // 1 CUSTOMER + 1 BOTH
    });

    it('should perform text search across multiple fields', async () => {
      await Company.create({
        name: 'Search Test Company',
        businessNumber: '111-11-11111',
        email: 'search@test.com',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
      
      const searchResults = await Company.find({
        $or: [
          { name: { $regex: 'Search', $options: 'i' } },
          { businessNumber: { $regex: '111', $options: 'i' } },
          { email: { $regex: 'search', $options: 'i' } }
        ]
      });
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].name).toContain('Search');
    });
  });
});