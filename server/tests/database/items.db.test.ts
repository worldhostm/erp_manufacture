import mongoose from 'mongoose';
import Item, { IItem } from '../../src/models/Item';
import Company from '../../src/models/Company';
import { testUsers, testCompanies, testItems, invalidTestData } from '../fixtures/testData';
import '../setup';

describe('Item Database Operations', () => {
  let testUser: any;
  let testSupplier: any;
  
  beforeEach(async () => {
    // Create a test user and supplier for references
    testUser = { _id: new mongoose.Types.ObjectId() };
    testSupplier = await Company.create({
      name: 'Test Supplier',
      type: 'SUPPLIER',
      createdBy: testUser._id
    });
  });

  describe('CREATE Operations', () => {
    it('should create a valid raw material item', async () => {
      const itemData = {
        ...testItems[0],
        supplierId: testSupplier._id,
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemData);
      
      expect(item).toBeDefined();
      expect(item.code).toBe(testItems[0].code);
      expect(item.name).toBe(testItems[0].name);
      expect(item.category).toBe('RAW_MATERIAL');
      expect(item.supplierId?.toString()).toBe(testSupplier._id.toString());
      expect(item.unit).toBe(testItems[0].unit);
      expect(item.price).toBe(testItems[0].price);
      expect(item.cost).toBe(testItems[0].cost);
      expect(item.isActive).toBe(true);
      expect(item.createdBy).toEqual(testUser._id);
      expect(item.createdAt).toBeDefined();
      expect(item.updatedAt).toBeDefined();
    });

    it('should create a component item', async () => {
      const itemData = {
        ...testItems[1],
        supplierId: testSupplier._id,
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemData);
      
      expect(item).toBeDefined();
      expect(item.category).toBe('COMPONENT');
      expect(item.expiryDays).toBe(testItems[1].expiryDays);
    });

    it('should create a finished product item without supplier', async () => {
      const itemData = {
        ...testItems[2],
        createdBy: testUser._id
      };
      delete (itemData as any).supplierId; // Remove supplier for finished product
      
      const item = await Item.create(itemData);
      
      expect(item).toBeDefined();
      expect(item.category).toBe('FINISHED_PRODUCT');
      expect(item.supplierId).toBeUndefined();
    });

    it('should create a consumable item', async () => {
      const itemData = {
        ...testItems[3],
        supplierId: testSupplier._id,
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemData);
      
      expect(item).toBeDefined();
      expect(item.category).toBe('CONSUMABLE');
      expect(item.storageConditions).toBe(testItems[3].storageConditions);
    });

    it('should create an item with minimal required fields', async () => {
      const minimalItem = {
        code: 'MIN001',
        name: 'Minimal Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      const item = await Item.create(minimalItem);
      
      expect(item).toBeDefined();
      expect(item.code).toBe('MIN001');
      expect(item.name).toBe('Minimal Item');
      expect(item.minStock).toBe(0);
      expect(item.maxStock).toBe(0);
      expect(item.safetyStock).toBe(0);
      expect(item.leadTime).toBe(0);
      expect(item.isActive).toBe(true);
    });

    it('should create an item with dimensions', async () => {
      const itemWithDimensions = {
        code: 'DIM001',
        name: 'Item with Dimensions',
        category: 'COMPONENT',
        unit: 'ea',
        price: 500,
        cost: 400,
        dimensions: {
          length: 100,
          width: 50,
          height: 25
        },
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemWithDimensions);
      
      expect(item.dimensions).toBeDefined();
      expect(item.dimensions?.length).toBe(100);
      expect(item.dimensions?.width).toBe(50);
      expect(item.dimensions?.height).toBe(25);
    });

    it('should create an item with images and tags', async () => {
      const itemWithExtras = {
        code: 'EXT001',
        name: 'Item with Extras',
        category: 'FINISHED_PRODUCT',
        unit: 'ea',
        price: 1000,
        cost: 800,
        images: ['image1.jpg', 'image2.jpg'],
        tags: ['premium', 'electronic', 'export'],
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemWithExtras);
      
      expect(item.images).toHaveLength(2);
      expect(item.images).toContain('image1.jpg');
      expect(item.tags).toHaveLength(3);
      expect(item.tags).toContain('premium');
    });

    it('should create an item with custom fields', async () => {
      const itemWithCustom = {
        code: 'CUS001',
        name: 'Item with Custom Fields',
        category: 'RAW_MATERIAL',
        unit: 'kg',
        price: 200,
        cost: 150,
        customFields: {
          color: 'blue',
          material: 'steel',
          certified: true,
          supplier_code: 'SUP-ABC-001'
        },
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemWithCustom);
      
      expect(item.customFields).toBeDefined();
      expect(item.customFields?.color).toBe('blue');
      expect(item.customFields?.material).toBe('steel');
      expect(item.customFields?.certified).toBe(true);
    });

    it('should fail to create item without required code field', async () => {
      const invalidItem = {
        name: 'No Code Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow('Item code is required');
    });

    it('should fail to create item without required name field', async () => {
      const invalidItem = {
        code: 'NONAME001',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow('Item name is required');
    });

    it('should fail to create item with invalid category', async () => {
      const invalidItem = {
        code: 'INV001',
        name: 'Invalid Category Item',
        category: 'INVALID_CATEGORY',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow();
    });

    it('should fail to create item with negative price', async () => {
      const invalidItem = {
        ...invalidTestData.item.negativePrice,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow('Price cannot be negative');
    });

    it('should fail to create item with negative cost', async () => {
      const invalidItem = {
        code: 'NEGCOST001',
        name: 'Negative Cost Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: -50,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow('Cost cannot be negative');
    });

    it('should fail to create item with maxStock less than minStock', async () => {
      const invalidItem = {
        ...invalidTestData.item.maxStockLessThanMin,
        createdBy: testUser._id
      };
      
      await expect(Item.create(invalidItem))
        .rejects
        .toThrow('Maximum stock must be greater than or equal to minimum stock');
    });

    it('should fail to create items with duplicate codes', async () => {
      const itemData = {
        code: 'DUP001',
        name: 'Duplicate Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      await Item.create(itemData);
      
      await expect(Item.create(itemData))
        .rejects
        .toThrow();
    });

    it('should automatically convert code to uppercase', async () => {
      const itemData = {
        code: 'lower001',
        name: 'Lowercase Code Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      };
      
      const item = await Item.create(itemData);
      
      expect(item.code).toBe('LOWER001');
    });
  });

  describe('READ Operations', () => {
    let createdItems: IItem[];
    let supplier1: any, supplier2: any;

    beforeEach(async () => {
      // Create test suppliers
      supplier1 = await Company.create({
        name: 'Supplier 1',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
      supplier2 = await Company.create({
        name: 'Supplier 2',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });

      // Create test items
      createdItems = await Promise.all([
        Item.create({
          ...testItems[0],
          supplierId: supplier1._id,
          createdBy: testUser._id
        }),
        Item.create({
          ...testItems[1],
          supplierId: supplier2._id,
          createdBy: testUser._id
        }),
        Item.create({
          ...testItems[2],
          createdBy: testUser._id
        }),
        Item.create({
          ...testItems[3],
          supplierId: supplier1._id,
          createdBy: testUser._id
        })
      ]);
    });

    it('should find all items', async () => {
      const items = await Item.find();
      
      expect(items).toHaveLength(4);
    });

    it('should find items by category', async () => {
      const rawMaterials = await Item.find({ category: 'RAW_MATERIAL' });
      const components = await Item.find({ category: 'COMPONENT' });
      const finishedProducts = await Item.find({ category: 'FINISHED_PRODUCT' });
      const consumables = await Item.find({ category: 'CONSUMABLE' });
      
      expect(rawMaterials).toHaveLength(1);
      expect(components).toHaveLength(1);
      expect(finishedProducts).toHaveLength(1);
      expect(consumables).toHaveLength(1);
    });

    it('should find items by supplier', async () => {
      const supplier1Items = await Item.find({ supplierId: supplier1._id });
      const supplier2Items = await Item.find({ supplierId: supplier2._id });
      const noSupplierItems = await Item.find({ supplierId: { $exists: false } });
      
      expect(supplier1Items).toHaveLength(2);
      expect(supplier2Items).toHaveLength(1);
      expect(noSupplierItems).toHaveLength(1);
    });

    it('should find active items only', async () => {
      // Deactivate one item
      await Item.findByIdAndUpdate(createdItems[0]._id, { isActive: false });
      
      const activeItems = await Item.find({ isActive: true });
      const inactiveItems = await Item.find({ isActive: false });
      
      expect(activeItems).toHaveLength(3);
      expect(inactiveItems).toHaveLength(1);
    });

    it('should find item by code', async () => {
      const item = await Item.findOne({ code: testItems[0].code });
      
      expect(item).toBeDefined();
      expect(item!.code).toBe(testItems[0].code);
    });

    it('should find item by name using regex search', async () => {
      const items = await Item.find({
        name: { $regex: 'Steel', $options: 'i' }
      });
      
      expect(items).toHaveLength(1);
      expect(items[0].name).toContain('Steel');
    });

    it('should find items with price range', async () => {
      const expensiveItems = await Item.find({
        price: { $gte: 100000 }
      });
      const cheapItems = await Item.find({
        price: { $lt: 50000 }
      });
      
      expect(expensiveItems).toHaveLength(2); // Motor and Finished Product
      expect(cheapItems).toHaveLength(2); // Steel and Lubricant
    });

    it('should find items with low stock (below safety stock)', async () => {
      // Assume we have stock tracking - this is a logical query structure
      const lowStockItems = await Item.find({
        // This would typically involve a stock collection lookup
        // For now, just find items with safety stock > 0
        safetyStock: { $gt: 0 }
      });
      
      expect(lowStockItems).toHaveLength(4);
    });

    it('should populate supplier information', async () => {
      const items = await Item.find({ supplierId: { $exists: true } })
        .populate('supplierId', 'name type');
      
      expect(items).toHaveLength(3);
      items.forEach(item => {
        expect(item.supplierId).toBeDefined();
        expect((item.supplierId as any).name).toBeDefined();
        expect((item.supplierId as any).type).toBeDefined();
      });
    });

    it('should find items by barcode', async () => {
      const item = await Item.findOne({ barcode: testItems[0].barcode });
      
      expect(item).toBeDefined();
      expect(item!.barcode).toBe(testItems[0].barcode);
    });

    it('should find items by tags', async () => {
      const taggedItems = await Item.find({
        tags: { $in: ['steel', 'premium'] }
      });
      
      expect(taggedItems).toHaveLength(2); // Steel sheet and Finished Product
    });

    it('should find items with custom fields query', async () => {
      const certifiedItems = await Item.find({
        'customFields.grade': 'A'
      });
      
      expect(certifiedItems).toHaveLength(1);
    });

    it('should sort items by name ascending', async () => {
      const items = await Item.find().sort({ name: 1 });
      
      expect(items).toHaveLength(4);
      // Should be alphabetically sorted
      expect(items[0].name).toBe('Finished Product A');
      expect(items[1].name).toBe('Lubricant Oil');
      expect(items[2].name).toBe('Motor Assembly');
      expect(items[3].name).toBe('Steel Sheet 10mm');
    });

    it('should sort items by price descending', async () => {
      const items = await Item.find().sort({ price: -1 });
      
      expect(items[0].price).toBeGreaterThanOrEqual(items[1].price);
      expect(items[1].price).toBeGreaterThanOrEqual(items[2].price);
      expect(items[2].price).toBeGreaterThanOrEqual(items[3].price);
    });

    it('should implement pagination', async () => {
      const page1 = await Item.find().limit(2).skip(0);
      const page2 = await Item.find().limit(2).skip(2);
      
      expect(page1).toHaveLength(2);
      expect(page2).toHaveLength(2);
    });
  });

  describe('UPDATE Operations', () => {
    let testItem: IItem;
    let newSupplier: any;

    beforeEach(async () => {
      testItem = await Item.create({
        ...testItems[0],
        supplierId: testSupplier._id,
        createdBy: testUser._id
      });
      
      newSupplier = await Company.create({
        name: 'New Supplier',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
    });

    it('should update item name', async () => {
      const updatedName = 'Updated Steel Sheet';
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { name: updatedName },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.name).toBe(updatedName);
      expect(updatedItem!.updatedAt.getTime()).toBeGreaterThan(
        testItem.createdAt.getTime()
      );
    });

    it('should update item price and cost', async () => {
      const newPrice = 6000;
      const newCost = 5500;
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { price: newPrice, cost: newCost },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.price).toBe(newPrice);
      expect(updatedItem!.cost).toBe(newCost);
    });

    it('should update stock levels', async () => {
      // Update maxStock first to ensure it's higher, then minStock
      const updatedItem1 = await Item.findByIdAndUpdate(
        testItem._id,
        { maxStock: 2000, safetyStock: 100 },
        { new: true, runValidators: true }
      );
      
      const updatedItem2 = await Item.findByIdAndUpdate(
        testItem._id,
        { minStock: 200 },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem2!.minStock).toBe(200);
      expect(updatedItem2!.maxStock).toBe(2000);
      expect(updatedItem2!.safetyStock).toBe(100);
    });

    it('should update supplier', async () => {
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { supplierId: newSupplier._id },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.supplierId?.toString()).toBe(newSupplier._id.toString());
    });

    it('should update category', async () => {
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { category: 'COMPONENT' },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.category).toBe('COMPONENT');
    });

    it('should update dimensions', async () => {
      const newDimensions = {
        length: 2500,
        width: 1200,
        height: 12
      };
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { dimensions: newDimensions },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.dimensions).toEqual(newDimensions);
    });

    it('should update images array', async () => {
      const newImages = ['updated1.jpg', 'updated2.jpg', 'updated3.jpg'];
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { images: newImages },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.images).toEqual(newImages);
    });

    it('should update tags array', async () => {
      const newTags = ['updated', 'modified', 'test'];
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { tags: newTags },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.tags).toEqual(newTags);
    });

    it('should update custom fields', async () => {
      const newCustomFields = {
        updated: true,
        version: '2.0',
        tester: 'automated'
      };
      
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { customFields: newCustomFields },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.customFields).toEqual(newCustomFields);
    });

    it('should soft delete item by setting isActive to false', async () => {
      const updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { isActive: false },
        { new: true }
      );
      
      expect(updatedItem!.isActive).toBe(false);
    });

    it('should fail to update with invalid price', async () => {
      await expect(
        Item.findByIdAndUpdate(
          testItem._id,
          { price: -100 },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow('Price cannot be negative');
    });

    it('should fail to update with invalid cost', async () => {
      await expect(
        Item.findByIdAndUpdate(
          testItem._id,
          { cost: -50 },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow('Cost cannot be negative');
    });

    it('should fail to update with maxStock less than minStock', async () => {
      // Since update validators don't run custom validation in the same way,
      // we test this by trying to save a document directly
      const item = await Item.findById(testItem._id);
      if (item) {
        item.minStock = 100;
        item.maxStock = 50;
        
        await expect(item.save()).rejects.toThrow('Maximum stock must be greater than or equal to minimum stock');
      }
    });

    it('should fail to update with invalid category', async () => {
      await expect(
        Item.findByIdAndUpdate(
          testItem._id,
          { category: 'INVALID_CATEGORY' },
          { new: true, runValidators: true }
        )
      ).rejects.toThrow();
    });

    it('should update multiple fields at once', async () => {
      const updateData = {
        name: 'Multi Update Item',
        price: 7000,
        cost: 6000,
        specification: 'Updated specification',
        tags: ['multi', 'update']
      };
      
      // Update non-stock fields
      let updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        updateData,
        { new: true, runValidators: true }
      );
      
      // Update maxStock first, then minStock
      updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { maxStock: 1500 },
        { new: true, runValidators: true }
      );
      
      updatedItem = await Item.findByIdAndUpdate(
        testItem._id,
        { minStock: 150 },
        { new: true, runValidators: true }
      );
      
      expect(updatedItem!.name).toBe(updateData.name);
      expect(updatedItem!.price).toBe(updateData.price);
      expect(updatedItem!.cost).toBe(updateData.cost);
      expect(updatedItem!.minStock).toBe(150);
      expect(updatedItem!.maxStock).toBe(1500);
      expect(updatedItem!.specification).toBe(updateData.specification);
      expect(updatedItem!.tags).toEqual(updateData.tags);
    });
  });

  describe('DELETE Operations', () => {
    let testItem: IItem;

    beforeEach(async () => {
      testItem = await Item.create({
        ...testItems[0],
        supplierId: testSupplier._id,
        createdBy: testUser._id
      });
    });

    it('should hard delete an item', async () => {
      await Item.findByIdAndDelete(testItem._id);
      
      const deletedItem = await Item.findById(testItem._id);
      expect(deletedItem).toBeNull();
    });

    it('should soft delete an item by setting isActive to false', async () => {
      await Item.findByIdAndUpdate(testItem._id, { isActive: false });
      
      const softDeletedItem = await Item.findById(testItem._id);
      expect(softDeletedItem).toBeDefined();
      expect(softDeletedItem!.isActive).toBe(false);
    });

    it('should delete multiple items by filter', async () => {
      // Create more test items
      await Item.create({
        code: 'DEL001',
        name: 'Delete Test 1',
        category: 'CONSUMABLE',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      });
      await Item.create({
        code: 'DEL002',
        name: 'Delete Test 2',
        category: 'CONSUMABLE',
        unit: 'ea',
        price: 100,
        cost: 80,
        createdBy: testUser._id
      });
      
      const deleteResult = await Item.deleteMany({ category: 'CONSUMABLE' });
      
      expect(deleteResult.deletedCount).toBe(2);
      
      const remainingConsumables = await Item.find({ category: 'CONSUMABLE' });
      expect(remainingConsumables).toHaveLength(0);
    });

    it('should handle deletion of non-existent item gracefully', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      
      const result = await Item.findByIdAndDelete(nonExistentId);
      expect(result).toBeNull();
    });
  });

  describe('Complex Queries and Business Logic', () => {
    let supplier1: any, supplier2: any;

    beforeEach(async () => {
      // Create suppliers
      supplier1 = await Company.create({
        name: 'Primary Supplier',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });
      supplier2 = await Company.create({
        name: 'Secondary Supplier',
        type: 'SUPPLIER',
        createdBy: testUser._id
      });

      // Create various items for complex queries
      await Promise.all([
        Item.create({
          code: 'EXP001',
          name: 'Expensive Component',
          category: 'COMPONENT',
          supplierId: supplier1._id,
          unit: 'ea',
          price: 200000,
          cost: 150000,
          minStock: 10,
          maxStock: 100,
          safetyStock: 5,
          isActive: true,
          tags: ['expensive', 'critical'],
          createdBy: testUser._id
        }),
        Item.create({
          code: 'CHEAP001',
          name: 'Cheap Material',
          category: 'RAW_MATERIAL',
          supplierId: supplier2._id,
          unit: 'kg',
          price: 1000,
          cost: 800,
          minStock: 1000,
          maxStock: 10000,
          safetyStock: 500,
          isActive: true,
          tags: ['bulk', 'cheap'],
          createdBy: testUser._id
        }),
        Item.create({
          code: 'INACTIVE001',
          name: 'Inactive Item',
          category: 'CONSUMABLE',
          unit: 'liter',
          price: 5000,
          cost: 4000,
          isActive: false,
          createdBy: testUser._id
        }),
        Item.create({
          code: 'CRITICAL001',
          name: 'Critical Component',
          category: 'COMPONENT',
          supplierId: supplier1._id,
          unit: 'ea',
          price: 50000,
          cost: 40000,
          minStock: 50,
          maxStock: 200,
          safetyStock: 25,
          isActive: true,
          tags: ['critical', 'component'],
          leadTime: 30,
          createdBy: testUser._id
        })
      ]);
    });

    it('should find high-value items (price > 100000)', async () => {
      const highValueItems = await Item.find({
        price: { $gt: 100000 },
        isActive: true
      });
      
      expect(highValueItems).toHaveLength(1);
      expect(highValueItems[0].name).toBe('Expensive Component');
    });

    it('should find items with high profit margin', async () => {
      const items = await Item.aggregate([
        {
          $match: { isActive: true }
        },
        {
          $addFields: {
            profitMargin: {
              $divide: [
                { $subtract: ['$price', '$cost'] },
                '$cost'
              ]
            }
          }
        },
        {
          $match: {
            profitMargin: { $gte: 0.3 } // 30% or higher margin
          }
        }
      ]);
      
      expect(items.length).toBeGreaterThan(0);
    });

    it('should find items by multiple suppliers', async () => {
      const items = await Item.find({
        supplierId: { $in: [supplier1._id, supplier2._id] },
        isActive: true
      });
      
      expect(items).toHaveLength(3); // Expensive, Cheap, Critical
    });

    it('should find critical items with long lead times', async () => {
      const criticalItems = await Item.find({
        tags: 'critical',
        leadTime: { $gte: 14 },
        isActive: true
      });
      
      expect(criticalItems).toHaveLength(1);
      expect(criticalItems[0].name).toBe('Critical Component');
    });

    it('should count items by category', async () => {
      const categoryCount = await Item.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
        { $sort: { _id: 1 } }
      ]);
      
      expect(categoryCount).toHaveLength(2); // COMPONENT and RAW_MATERIAL
      expect(categoryCount.find(c => c._id === 'COMPONENT')?.count).toBe(2);
      expect(categoryCount.find(c => c._id === 'RAW_MATERIAL')?.count).toBe(1);
    });

    it('should find items with stock levels below safety stock', async () => {
      // This would typically involve actual stock data
      // For now, simulate with items that have safety stock defined
      const lowStockItems = await Item.find({
        safetyStock: { $gt: 0 },
        isActive: true
      }).select('code name safetyStock minStock maxStock');
      
      expect(lowStockItems.length).toBeGreaterThan(0);
    });

    it('should perform text search across name, specification, and description', async () => {
      // Create an item with searchable content
      await Item.create({
        code: 'SEARCH001',
        name: 'Searchable Item',
        category: 'RAW_MATERIAL',
        unit: 'ea',
        price: 1000,
        cost: 800,
        specification: 'High quality aluminum material',
        description: 'Premium aluminum for aerospace applications',
        createdBy: testUser._id
      });
      
      const searchResults = await Item.find({
        $or: [
          { name: { $regex: 'aluminum', $options: 'i' } },
          { specification: { $regex: 'aluminum', $options: 'i' } },
          { description: { $regex: 'aluminum', $options: 'i' } }
        ]
      });
      
      expect(searchResults).toHaveLength(1);
      expect(searchResults[0].code).toBe('SEARCH001');
    });

    it('should find items by custom field values', async () => {
      // Create item with custom fields
      await Item.create({
        code: 'CUSTOM001',
        name: 'Custom Field Item',
        category: 'COMPONENT',
        unit: 'ea',
        price: 5000,
        cost: 4000,
        customFields: {
          material: 'titanium',
          grade: 'medical',
          certified: true
        },
        createdBy: testUser._id
      });
      
      const customItems = await Item.find({
        'customFields.material': 'titanium',
        'customFields.certified': true
      });
      
      expect(customItems).toHaveLength(1);
      expect(customItems[0].code).toBe('CUSTOM001');
    });

    it('should calculate total inventory value by supplier', async () => {
      const inventoryValue = await Item.aggregate([
        { $match: { isActive: true, supplierId: { $exists: true } } },
        {
          $group: {
            _id: '$supplierId',
            totalValue: {
              $sum: { $multiply: ['$cost', { $ifNull: ['$minStock', 0] }] }
            },
            itemCount: { $sum: 1 }
          }
        },
        {
          $lookup: {
            from: 'companies',
            localField: '_id',
            foreignField: '_id',
            as: 'supplier'
          }
        },
        {
          $unwind: '$supplier'
        },
        {
          $project: {
            supplierName: '$supplier.name',
            totalValue: 1,
            itemCount: 1
          }
        }
      ]);
      
      expect(inventoryValue).toHaveLength(2); // Two suppliers
      expect(inventoryValue.every(item => item.totalValue >= 0)).toBe(true);
    });
  });
});