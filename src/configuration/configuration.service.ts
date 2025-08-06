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
    // Enforce one row per user
    const existing = await this.repo.findOne({ where: { userId: dto.userId } });
    if (existing) {
      throw new ConflictException('Configuration already exists for this user');
    }
    const entity = this.repo.create(dto);
    return this.repo.save(entity);
  }

  async getByUserId(userId: number): Promise<Configuration> {
    const config = await this.repo.findOne({ where: { userId } });
    if (!config) throw new NotFoundException('Configuration not found');
    return config;
  }

  async upsertByUserId(
    userId: number,
    dto: UpdateConfigurationDto | CreateConfigurationDto,
  ): Promise<Configuration> {
    const existing = await this.repo.findOne({ where: { userId } });
    if (!existing) {
      // allow create via upsert
      const created = this.repo.create({ userId, ...dto });
      return this.repo.save(created);
    }
    const updated = this.repo.merge(existing, dto);
    return this.repo.save(updated);
  }

  async updateByUserId(
    userId: number,
    dto: UpdateConfigurationDto,
  ): Promise<Configuration> {
    const config = await this.getByUserId(userId);
    const merged = this.repo.merge(config, dto);
    return this.repo.save(merged);
  }

  async deleteByUserId(userId: number): Promise<{ deleted: true }> {
    const res = await this.repo.delete({ userId });
    if (res.affected === 0)
      throw new NotFoundException('Configuration not found');
    return { deleted: true };
  }
}
