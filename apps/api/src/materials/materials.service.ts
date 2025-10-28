import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class MaterialsService {
  private readonly logger = new LoggerService('MaterialsService');

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async findAll(query: any = {}) {
    this.logger.logMethodCall('findAll', query);
    const {
      type,
      folderId,
      q,
      page = 1,
      pageSize = 20,
    } = query;

    const pageNum = Math.max(1, parseInt(String(page), 10) || 1);
    const pageSizeNum = Math.min(100, Math.max(1, parseInt(String(pageSize), 10) || 20));

    const queryBuilder = this.materialRepository.createQueryBuilder('material');

    if (type) {
      queryBuilder.andWhere('material.type = :type', { type });
    }

    if (folderId) {
      queryBuilder.andWhere('material.folderId = :folderId', { folderId });
    }

    if (q) {
      queryBuilder.andWhere(
        '(material.title ILIKE :search OR material.content ILIKE :search)',
        { search: `%${q}%` }
      );
    }

    queryBuilder.orderBy('material.createdAt', 'DESC');

    const skip = (pageNum - 1) * pageSizeNum;
    queryBuilder.skip(skip).take(pageSizeNum);

    const [items, total] = await queryBuilder.getManyAndCount();

    const result = {
      items,
      page: pageNum,
      pageSize: pageSizeNum,
      total,
    };
    this.logger.logMethodResult('findAll', { total, page: pageNum, pageSize: pageSizeNum });
    return result;
  }

  async findById(id: string): Promise<Material> {
    this.logger.logMethodCall('findById', { id });
    const material = await this.materialRepository.findOne({
      where: { id },
    });

    if (!material) {
      this.logger.warn(`Material not found: ${id}`);
      throw new NotFoundException('Material not found');
    }

    this.logger.logMethodResult('findById', { id: material.id });
    return material;
  }

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    this.logger.logMethodCall('create', { ...createMaterialDto });
    const material = this.materialRepository.create(createMaterialDto as DeepPartial<Material>);
    const saved = await this.materialRepository.save(material);
    this.logger.logMethodResult('create', { id: saved.id });
    return saved;
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
    this.logger.logMethodCall('update', { id, ...updateMaterialDto });
    const material = await this.findById(id);

    Object.assign(material, updateMaterialDto);
    const saved = await this.materialRepository.save(material);
    this.logger.logMethodResult('update', { id: saved.id });
    return saved;
  }

  async delete(id: string): Promise<void> {
    this.logger.logMethodCall('delete', { id });
    const material = await this.findById(id);
    await this.materialRepository.remove(material);
    this.logger.logMethodResult('delete', { id, removed: true });
  }

  // 合併原 library 功能
  async getLibraryTree(query: any = {}) {
    this.logger.logMethodCall('getLibraryTree', query);
    const { include = 'all', depth = 2 } = query;

    // 從資料庫獲取所有教材
    const materials = await this.materialRepository.find({
      order: { createdAt: 'DESC' },
    });

    // 建立資料夾樹結構
    const mockLibrary = {
      folders: [
        {
          id: 'folder-001',
          name: 'English Materials',
          parentId: null,
          path: '/English Materials',
          children: [
            {
              id: 'folder-002',
              name: 'Beginner',
              parentId: 'folder-001',
              path: '/English Materials/Beginner',
              materials: materials.filter(m => m.title.includes('Basic') || m.title.includes('beginner'))
            },
            {
              id: 'folder-003',
              name: 'Intermediate',
              parentId: 'folder-001',
              path: '/English Materials/Intermediate',
              materials: materials.filter(m => m.title.includes('Intermediate') || m.title.includes('Daily'))
            },
            {
              id: 'folder-004',
              name: 'Advanced',
              parentId: 'folder-001',
              path: '/English Materials/Advanced',
              materials: materials.filter(m => m.title.includes('Advanced') || m.title.includes('Business'))
            }
          ]
        },
        {
          id: 'folder-005',
          name: 'Other Materials',
          parentId: null,
          path: '/Other Materials',
          materials: materials.filter(m =>
            !m.title.includes('Basic') &&
            !m.title.includes('Intermediate') &&
            !m.title.includes('Advanced') &&
            !m.title.includes('Daily') &&
            !m.title.includes('Business')
          )
        }
      ]
    };

    if (include === 'flat') {
      const result = { materials };
      this.logger.logMethodResult('getLibraryTree', { mode: 'flat', count: materials.length });
      return result;
    }

    if (include === 'root') {
      const result = {
        folders: mockLibrary.folders.map(folder => ({
          ...folder,
          children: undefined // 移除子資料夾
        }))
      };
      this.logger.logMethodResult('getLibraryTree', { mode: 'root', folders: result.folders.length });
      return result;
    }

    this.logger.logMethodResult('getLibraryTree', { mode: 'all', folders: mockLibrary.folders.length });
    return mockLibrary;
  }
}