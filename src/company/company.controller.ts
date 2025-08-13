import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Delete,
  ParseIntPipe,
  Query,
  UploadedFile,
  UseInterceptors,
  Patch,
} from '@nestjs/common';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { imageMulterOptions } from '../common/multer-image.options';

@Controller('companies')
@UseGuards(AuthGuard('jwt'))
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Get()
  findAllWithFilters(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('search') search?: string,
  ) {
    return this.companyService.findAllWithFilters(
      Number(page),
      Number(limit),
      search,
    );
  }

  @Get()
  findAll() {
    return this.companyService.findAll();
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findById(id);
  }

  @Delete(':id')
  delete(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.delete(id);
  }

  @Post()
  @UseInterceptors(FileInterceptor('logo', imageMulterOptions))
  async create(
    @Body() dto: CreateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.companyService.createWithOptionalLogo(dto, file);
  }

  @Patch(':id')
  @UseInterceptors(FileInterceptor('logo', imageMulterOptions))
  async update(
    @Param('id', ParseIntPipe) id: number, // or ParseIntPipe if numeric
    @Body() dto: UpdateCompanyDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.companyService.updateWithOptionalLogo(id, dto, file);
  }
}
