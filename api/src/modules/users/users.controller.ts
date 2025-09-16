import { Body, Controller, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { RolesGuard } from '../../common/roles.guard';
import { ListUsersDto } from './dto/list-users.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private users: UsersService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateUserDto) {
    return this.users.createUser(dto);
  }

  @Get()
  @Roles(Role.Admin)
  async list(@Query() q: ListUsersDto) {
    return this.users.listUsers(q);
  }

  @Get('me')
  async me(@Req() req: any) {
    return req.user;
  }

  @Get('profile')
  async getProfile(@Req() req: any) {
    return this.users.getUserById(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.users.updateProfile(req.user.id, dto);
  }

  @Get(':id')
  @Roles(Role.Admin)
  async getOne(@Param('id') id: string) {
    return this.users.getUserById(id);
  }

  @Post('reset-password')
  @Roles(Role.Admin)
  async resetPassword(@Body() dto: ResetPasswordDto) {
    return this.users.resetPassword(dto.userId, dto.newPassword);
  }
}