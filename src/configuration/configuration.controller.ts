import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ConfigurationService } from './configuration.service';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';
import { Configuration } from './configuration.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Controller('users/:userId/configuration')
@UseGuards(AuthGuard('jwt'))
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get()
  get(@Param('userId', ParseIntPipe) userId: number): Promise<Configuration> {
    return this.service.getByUserId(userId);
  }

  @Post()
  create(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: Omit<CreateConfigurationDto, 'userId'>,
  ): Promise<Configuration> {
    return this.service.create({ userId, ...body });
  }

  @Patch()
  update(
    @Param('userId', ParseIntPipe) userId: number,
    @Body() body: UpdateConfigurationDto,
  ): Promise<Configuration> {
    return this.service.updateByUserId(userId, body);
  }

  // Optional convenience: PUT to upsert
  // @Put()
  // upsert(
  //   @Param('userId', ParseIntPipe) userId: number,
  //   @Body() body: UpdateConfigurationDto,
  // ): Promise<Configuration> {
  //   return this.service.upsertByUserId(userId, body);
  // }

  @Delete()
  remove(@Param('userId', ParseIntPipe) userId: number) {
    return this.service.deleteByUserId(userId);
  }
}
