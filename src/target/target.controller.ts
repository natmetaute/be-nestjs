import {
  Controller,
  Get,
  Body,
  Post,
  Put,
  Delete,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { TargetService } from './target.service';
import { Target } from './target.entity';

@Controller('targets')
export class TargetController {
  constructor(private readonly service: TargetService) {}

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const target = await this.service.findById(+id);
    if (!target) {
      throw new NotFoundException(`Target with ID ${id} not found`);
    }
    return target;
  }

  @Post()
  create(@Body() data: Partial<Target>) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: Partial<Target>) {
    return this.service.update(+id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.delete(+id);
  }
}
