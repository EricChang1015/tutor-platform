import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeepPartial } from 'typeorm';
import { Material, MaterialType } from '../entities/material.entity';
import { Folder } from '../entities/folder.entity';
import { CreateMaterialDto } from './dto/create-material.dto';
import { UpdateMaterialDto } from './dto/update-material.dto';
import { CreateFolderDto } from './dto/create-folder.dto';
import { UpdateFolderDto } from './dto/update-folder.dto';
import { LoggerService } from '../common/logger.service';
import { UploadsService } from '../uploads/uploads.service';
import { FileCategory } from '../uploads/upload.config';

@Injectable()
export class MaterialsService {
  private readonly logger = new LoggerService('MaterialsService');

  constructor(
    @InjectRepository(Material)
    private materialRepository: Repository<Material>,
    @InjectRepository(Folder)
    private folderRepository: Repository<Folder>,
    private uploadsService: UploadsService,
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

    // 檢查資料夾是否存在
    if (createMaterialDto.folderId) {
      const folder = await this.folderRepository.findOne({
        where: { id: createMaterialDto.folderId }
      });
      if (!folder) {
        throw new NotFoundException('Folder not found');
      }
    }

    const material = this.materialRepository.create(createMaterialDto as DeepPartial<Material>);
    const saved = await this.materialRepository.save(material);
    this.logger.logMethodResult('create', { id: saved.id });
    return saved;
  }

  async createWithFile(userId: string, createMaterialDto: CreateMaterialDto, file?: any): Promise<Material> {
    this.logger.logMethodCall('createWithFile', { userId, type: createMaterialDto.type, hasFile: !!file });

    // 如果是 PDF 類型且有檔案，先上傳檔案
    if (createMaterialDto.type === MaterialType.PDF && file) {
      const upload = await this.uploadsService.uploadFile(
        userId,
        file,
        FileCategory.TEACHING_MATERIAL
      );

      // 設定檔案 URL
      createMaterialDto.fileUrl = upload.publicUrl || upload.filePath;
      if (upload.publicUrl) {
        createMaterialDto.previewUrl = upload.publicUrl;
      }
    }

    return this.create(createMaterialDto);
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

  // 資料夾相關方法
  async createFolder(createFolderDto: CreateFolderDto): Promise<Folder> {
    this.logger.logMethodCall('createFolder', createFolderDto);

    // 檢查父資料夾是否存在
    if (createFolderDto.parentId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: createFolderDto.parentId }
      });
      if (!parentFolder) {
        throw new NotFoundException('Parent folder not found');
      }
    }

    // 生成路徑
    let path = `/${createFolderDto.name}`;
    if (createFolderDto.parentId) {
      const parentFolder = await this.folderRepository.findOne({
        where: { id: createFolderDto.parentId }
      });
      path = `${parentFolder.path}/${createFolderDto.name}`;
    }

    const folder = this.folderRepository.create({
      ...createFolderDto,
      path,
    });

    const saved = await this.folderRepository.save(folder);
    this.logger.logMethodResult('createFolder', { id: saved.id, path: saved.path });
    return saved;
  }

  async updateFolder(id: string, updateFolderDto: UpdateFolderDto): Promise<Folder> {
    this.logger.logMethodCall('updateFolder', { id, ...updateFolderDto });
    const folder = await this.folderRepository.findOne({ where: { id } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 更新資料夾資訊
    Object.assign(folder, updateFolderDto);

    // 如果名稱有變更，需要更新路徑
    if (updateFolderDto.name) {
      const pathParts = folder.path.split('/');
      pathParts[pathParts.length - 1] = updateFolderDto.name;
      folder.path = pathParts.join('/');
    }

    const saved = await this.folderRepository.save(folder);
    this.logger.logMethodResult('updateFolder', { id: saved.id, path: saved.path });
    return saved;
  }

  async deleteFolder(id: string): Promise<void> {
    this.logger.logMethodCall('deleteFolder', { id });
    const folder = await this.folderRepository.findOne({ where: { id } });

    if (!folder) {
      throw new NotFoundException('Folder not found');
    }

    // 檢查是否有子資料夾或教材
    const childFolders = await this.folderRepository.count({ where: { parentId: id } });
    const materials = await this.materialRepository.count({ where: { folderId: id } });

    if (childFolders > 0 || materials > 0) {
      throw new BadRequestException('Cannot delete folder with children or materials');
    }

    await this.folderRepository.remove(folder);
    this.logger.logMethodResult('deleteFolder', { id, removed: true });
  }

  async getFolders(): Promise<Folder[]> {
    this.logger.logMethodCall('getFolders');
    const folders = await this.folderRepository.find({
      order: { path: 'ASC' }
    });
    this.logger.logMethodResult('getFolders', { count: folders.length });
    return folders;
  }

  // 合併原 library 功能
  async getLibraryTree(query: any = {}) {
    this.logger.logMethodCall('getLibraryTree', query);
    const { include = 'all', depth = 2 } = query;

    if (include === 'flat') {
      // 返回所有教材的扁平列表
      const materials = await this.materialRepository.find({
        relations: ['folder'],
        order: { createdAt: 'DESC' },
      });
      const result = { materials };
      this.logger.logMethodResult('getLibraryTree', { mode: 'flat', count: materials.length });
      return result;
    }

    // 獲取所有資料夾和教材
    const folders = await this.folderRepository.find({
      order: { path: 'ASC' }
    });

    const materials = await this.materialRepository.find({
      relations: ['folder'],
      order: { createdAt: 'DESC' }
    });

    // 建立樹狀結構
    const folderTree = this.buildFolderTree(folders, materials, include === 'root' ? 1 : depth);

    const result = { folders: folderTree };
    this.logger.logMethodResult('getLibraryTree', { mode: include, folders: folderTree.length });
    return result;
  }

  private buildFolderTree(folders: Folder[], materials: Material[], maxDepth: number): any[] {
    // 建立資料夾映射
    const folderMap = new Map<string, any>();
    const rootFolders: any[] = [];

    // 初始化資料夾節點
    folders.forEach(folder => {
      folderMap.set(folder.id, {
        id: folder.id,
        name: folder.name,
        type: 'folder',
        parentId: folder.parentId,
        path: folder.path,
        description: folder.description,
        children: [],
        materials: []
      });
    });

    // 分配教材到對應資料夾
    materials.forEach(material => {
      if (material.folderId && folderMap.has(material.folderId)) {
        folderMap.get(material.folderId).materials.push({
          id: material.id,
          type: material.type,
          title: material.title,
          content: material.content,
          fileUrl: material.fileUrl,
          previewUrl: material.previewUrl,
          meta: material.meta,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        });
      }
    });

    // 建立樹狀結構
    folders.forEach(folder => {
      const folderNode = folderMap.get(folder.id);
      if (folder.parentId && folderMap.has(folder.parentId)) {
        folderMap.get(folder.parentId).children.push(folderNode);
      } else {
        rootFolders.push(folderNode);
      }
    });

    return rootFolders;
  }
}