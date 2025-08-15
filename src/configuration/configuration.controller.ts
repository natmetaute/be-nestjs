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

@Controller('companies/:companyId/configuration')
@UseGuards(AuthGuard('jwt'))
export class ConfigurationController {
  constructor(private readonly service: ConfigurationService) {}

  @Get()
  get(
    @Param('companyId', ParseIntPipe) companyId: number,
  ): Promise<Configuration> {
    return this.service.getByCompanyId(companyId);
  }

  @Post()
  create(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() body: Omit<CreateConfigurationDto, 'companyId'>,
  ): Promise<Configuration> {
    return this.service.create({ companyId, ...body });
  }

  @Patch()
  update(
    @Param('companyId', ParseIntPipe) companyId: number,
    @Body() body: UpdateConfigurationDto,
  ): Promise<Configuration> {
    return this.service.updateByCompanyId(companyId, body);
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
  remove(@Param('companyId', ParseIntPipe) companyId: number) {
    return this.service.deleteByCompanyId(companyId);
  }
}
