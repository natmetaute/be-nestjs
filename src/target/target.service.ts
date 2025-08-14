import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTargetDto } from './dto/create-target.dto';
import { Target } from './target.entity';
import { Company } from '../company/company.entity';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class TargetService {
  constructor(
    @InjectRepository(Target)
    private readonly repo: Repository<Target>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {}

  async findAll(): Promise<Target[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<Target | null> {
    return this.repo.findOneBy({ id });
  }

  async create(data: Partial<Target>): Promise<Target> {
    const target = this.repo.create(data);
    return this.repo.save(target);
  }

  async update(id: number, data: Partial<Target>): Promise<Target | null> {
    await this.repo.update(id, data);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.delete(id);
  }

  async getTargetsForYear(year: number, companyId: number): Promise<Target[]> {
    return this.repo.find({
      where: {
        year,
        companyId,
      },
    });
  }

  async getTargetForPeriod(
    year: number,
    month?: number,
    quarter?: number,
  ): Promise<number> {
    if (month) {
      const target = await this.repo.findOneBy({ year, month });
      if (target) return +target.amount;
    }

    if (quarter) {
      const target = await this.repo.findOneBy({ year, quarter });
      if (target) return +target.amount;
    }

    // fallback to yearly
    const yearly = await this.repo.findOneBy({ year });
    if (yearly) {
      return month
        ? +yearly.amount / 12
        : quarter
          ? +yearly.amount / 4
          : +yearly.amount;
    }

    return 0;
  }

  async createOrUpdateTargets(
    targets: CreateTargetDto[],
    companyId: number,
  ): Promise<{
    insertedCount: number;
    updatedCount: number;
    updatedRecords: Target[];
    timeMs: number;
  }> {
    const start = Date.now();

    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) {
      throw new Error(`Company with ID ${companyId} not found.`);
    }

    const errors: { row: number; errors: string[] }[] = [];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      const txInstance = plainToInstance(CreateTargetDto, target);
      const validationErrors = await validate(txInstance);
      if (validationErrors.length > 0) {
        errors.push({
          row: i + 1,
          errors: validationErrors.map((ve) =>
            Object.values(ve.constraints || {}).join(', '),
          ),
        });
      }
    }

    if (errors.length > 0) {
      const formattedErrors = errors.map((err) => ({
        row: err.row,
        errors: err.errors,
      }));

      throw new BadRequestException({
        message: 'Validation failed',
        errors: formattedErrors,
      });
    }

    const inserted: Target[] = [];
    const updated: Target[] = [];

    for (const target of targets) {
      const existing = await this.repo.findOne({
        where: {
          year: target.year,
          month: target.month,
          quarter: target.quarter,
          companyId: companyId,
        },
      });

      if (existing) {
        existing.amount = target.amount;
        await this.repo.save(existing);
        updated.push(existing);
      } else {
        const entity = this.repo.create({
          amount: target.amount,
          year: target.year,
          month: target.month,
          quarter: target.quarter,
          company,
          companyId,
        });
        const saved = await this.repo.save(entity);
        inserted.push(saved);
      }
    }

    const end = Date.now();

    return {
      insertedCount: inserted.length,
      updatedCount: updated.length,
      updatedRecords: updated,
      timeMs: end - start,
    };
  }
}
