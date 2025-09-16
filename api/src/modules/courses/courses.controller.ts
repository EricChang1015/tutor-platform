import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
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
  @Roles(Role.Admin, Role.Teacher)
  async create(@Req() req: any, @Body() dto: CreateCourseDto) {
    return this.courses.create(req.user.id, dto);
  }

  @Get()
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async list() {
    return this.courses.listActive();
  }

  @Get('my-courses')
  @Roles(Role.Teacher)
  async getMyCourses(@Req() req: any) {
    return this.courses.getByTeacher(req.user.id);
  }

  @Get(':id')
  @Roles(Role.Admin, Role.Teacher, Role.Student)
  async get(@Param('id') id: string) {
    return this.courses.getById(id);
  }
}

