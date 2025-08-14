import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Configuration } from './configuration.entity';
import { CreateConfigurationDto } from './dto/create-configuration.dto';
import { UpdateConfigurationDto } from './dto/update-configuration.dto';

@Injectable()
export class ConfigurationService {
  constructor(
    @InjectRepository(Configuration)
    private readonly repo: Repository<Configuration>,
  ) {}

  async create(dto: CreateConfigurationDto): Promise<Configuration> {
    const existing = await this.repo.findOne({
      where: { companyId: dto.companyId },
    });
    if (existing) {
      throw new ConflictException('Configuration already exists for this user');
    }
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async getByCompanyId(companyId: number): Promise<Configuration> {
    const config = await this.repo.findOne({ where: { companyId } });
    if (!config) throw new NotFoundException('Configuration not found');
    return config;
  }

  async upsertByUserId(
    companyId: number,
    dto: UpdateConfigurationDto | CreateConfigurationDto,
  ): Promise<Configuration> {
    const existing = await this.repo.findOne({ where: { companyId } });
    if (!existing) {
      // allow create via upsert
      const created = this.repo.create({ companyId, ...dto });
      return this.repo.save(created);
    }
    const updated = this.repo.merge(existing, dto);
    return this.repo.save(updated);
  }

  async updateByCompanyId(
    userId: number,
    dto: UpdateConfigurationDto,
  ): Promise<Configuration> {
    const config = await this.getByCompanyId(userId);
    const merged = this.repo.merge(config, dto);
    return this.repo.save(merged);
  }

  async deleteByCompanyId(companyId: number): Promise<{ deleted: true }> {
    const res = await this.repo.delete({ companyId });
    if (res.affected === 0)
      throw new NotFoundException('Configuration not found');
    return { deleted: true };
  }
}
