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
}