import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Company } from 'src/company/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Company])],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
