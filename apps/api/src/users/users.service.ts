import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'role', 'name', 'avatarUrl', 'bio'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto, currentUserId: string): Promise<User> {
    // 檢查權限：只能更新自己的資料
    if (id !== currentUserId) {
      throw new Error('Forbidden: Can only update own profile');
    }

    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 更新用戶資料
    Object.assign(user, updateUserDto);
    await this.userRepository.save(user);

    // 返回更新後的公開資料
    return this.findById(id);
  }
}
