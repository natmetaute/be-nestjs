import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Target } from './target.entity';

@Injectable()
export class TargetService {
  constructor(
    @InjectRepository(Target)
    private readonly repo: Repository<Target>,
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
}
