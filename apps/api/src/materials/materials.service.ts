import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
  ) {}

  async findAll(query: any = {}) {
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

    return {
      items,
      page: pageNum,
      pageSize: pageSizeNum,
      total,
    };
  }

  async findById(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException('Material not found');
    }

    return material;
  }

  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const material = this.materialRepository.create(createMaterialDto as DeepPartial<Material>);
    return this.materialRepository.save(material);
  }

  async update(id: string, updateMaterialDto: UpdateMaterialDto): Promise<Material> {
    const material = await this.findById(id);
    
    Object.assign(material, updateMaterialDto);
    return this.materialRepository.save(material);
  }

  async delete(id: string): Promise<void> {
    const material = await this.findById(id);
    await this.materialRepository.remove(material);
  }

  // 合併原 library 功能
  async getLibraryTree(query: any = {}) {
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
      // 返回扁平結構
      return { materials };
    }

    if (include === 'root') {
      // 只返回根目錄
      return {
        folders: mockLibrary.folders.map(folder => ({
          ...folder,
          children: undefined // 移除子資料夾
        }))
      };
    }

    return mockLibrary;
  }
}