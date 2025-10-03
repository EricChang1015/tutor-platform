import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Material } from '../entities/material.entity';

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

    const queryBuilder = this.materialRepository.createQueryBuilder('material');

    // 篩選條件
    if (type) {
      queryBuilder.andWhere('material.type = :type', { type });
    }

    if (folderId) {
      queryBuilder.andWhere('material.folder_id = :folderId', { folderId });
    }

    if (q) {
      queryBuilder.andWhere(
        '(material.title ILIKE :search OR material.content ILIKE :search)',
        { search: `%${q}%` }
      );
    }

    // 排序
    queryBuilder.orderBy('material.created_at', 'DESC');

    // 分頁
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
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

  async create(createMaterialDto: any): Promise<Material> {
    const material = this.materialRepository.create(createMaterialDto);
    return this.materialRepository.save(material);
  }

  async update(id: string, updateMaterialDto: any): Promise<Material> {
    const material = await this.findById(id);
    
    Object.assign(material, updateMaterialDto);
    return this.materialRepository.save(material);
  }

  async delete(id: string): Promise<void> {
    const material = await this.findById(id);
    await this.materialRepository.delete(id);
  }
}
