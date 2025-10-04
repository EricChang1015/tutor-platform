import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FavoritesController } from './favorites.controller';
import { FavoritesService } from './favorites.service';
import { User } from '../entities/user.entity';
import { Favorite } from '../entities/favorite.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Favorite])],
  controllers: [FavoritesController],
  providers: [FavoritesService],
  exports: [FavoritesService],
})
export class FavoritesModule {}
