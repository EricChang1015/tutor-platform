import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { CoursesService } from './courses.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/roles.guard';
import { Roles } from '../../common/roles.decorator';
import { Role } from '../../common/roles.enum';
import { CreateCourseDto } from './dto/create-course.dto';

@Controller('courses')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CoursesController {
  constructor(private readonly courses: CoursesService) {}

  @Post()
  @Roles(Role.Admin)
  async create(@Body() dto: CreateCourseDto) {
    return this.courses.create(dto);
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async list() {
    return this.courses.listActive();
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async get(@Param('id') id: string) {
    return this.courses.getById(id);
  }
}

