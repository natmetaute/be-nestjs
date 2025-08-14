import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Company } from './company.entity';
import * as path from 'path';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import * as sharp from 'sharp';
import { promises as fs } from 'fs';
import { join } from 'path';

@Injectable()
export class CompanyService {
  private readonly logosDir = path.join(
    __dirname,
    '../../public/uploads/logos',
  );

  constructor(
    @InjectRepository(Company)
    private readonly repo: Repository<Company>,
  ) {}

  async create(dto: CreateCompanyDto): Promise<Company> {
    const exists = await this.repo.findOne({ where: { name: dto.name } });
    if (exists) {
      throw new BadRequestException('Company name already exists');
    }

    const company = this.repo.create(dto);

    return this.repo.save(company);
  }

  findAll() {
    return this.repo.find();
  }

  async findAllWithFilters(
    page = 1,
    limit = 10,
    search?: string,
  ): Promise<{ data: Company[]; total: number }> {
    const where = search ? { name: ILike(`%${search}%`) } : {};

    const queryBuilder = this.repo
      .createQueryBuilder('company')
      .leftJoin('company.users', 'user')
      .addSelect('COUNT(user.id)', 'userCount')
      .groupBy('company.id')
      .where(where)
      .orderBy('company.id', 'ASC');

    const result = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getRawAndEntities();

    const entities = result.entities;
    const raw = result.raw;

    if (!Array.isArray(entities) || !Array.isArray(raw)) {
      throw new Error('Expected entities and raw data to be arrays.');
    }

    const mappedData = entities.map((company, index) => ({
      ...company,
      userCount: Number(raw[index].userCount),
    }));

    const total = await this.repo
      .createQueryBuilder('company')
      .leftJoin('company.users', 'user')
      .where(where)
      .getCount();

    return { data: mappedData, total };
  }

  async findById(id: number): Promise<Company> {
    const company = await this.repo.findOne({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async createCompany(name: string): Promise<Company> {
    const exists = await this.repo.findOne({ where: { name } });
    if (exists) {
      throw new BadRequestException('Company already exists');
    }

    const company = this.repo.create({ name });
    return this.repo.save(company);
  }

  async findByName(companyName: string): Promise<Company> {
    const company = await this.repo.findOne({
      where: { name: companyName },
    });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  async update(id: number, dto: UpdateCompanyDto): Promise<Company> {
    const company = await this.findById(id);

    if (dto.name && dto.name !== company.name) {
      const exists = await this.repo.findOne({ where: { name: dto.name } });
      if (exists) {
        throw new BadRequestException('Company name already exists');
      }
    }

    Object.assign(company, dto);
    return this.repo.save(company);
  }

  async delete(id: number): Promise<void> {
    const result = await this.repo.delete(id);
    if (result.affected === 0) throw new NotFoundException('Company not found');
  }

  async createWithOptionalLogo(
    dto: CreateCompanyDto,
    file?: Express.Multer.File,
  ) {
    const company = this.repo.create({ ...dto });

    const savedCompany = await this.repo.save(company);

    if (file) {
      return await this.processAndSaveLogo(savedCompany.id, file);
    }

    return savedCompany;
  }

  async updateWithOptionalLogo(
    id: number,
    dto: UpdateCompanyDto,
    file?: Express.Multer.File,
  ) {
    const company = await this.repo.findOne({ where: { id } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    Object.assign(company, dto);
    if (file) {
      return await this.processAndSaveLogo(id, file);
    }

    return this.repo.save(company);
  }

  async processAndSaveLogo(companyId: number, file?: Express.Multer.File) {
    const company = await this.repo.findOne({ where: { id: companyId } });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    if (!file) return company;

    await fs.mkdir(this.logosDir, { recursive: true });

    if (company.logo) {
      const oldPath = join(this.logosDir, company.logo);
      fs.unlink(oldPath).catch(() => undefined);
    }

    const ext =
      file.mimetype === 'image/png'
        ? '.png'
        : file.mimetype === 'image/webp'
          ? '.webp'
          : '.jpg';

    const filename = `logo-${companyId}${ext}`;
    const outputPath = join(this.logosDir, filename);

    console.log('outputPath: ', outputPath);

    const pipeline = sharp(file.buffer).resize({
      height: 50,
      withoutEnlargement: true,
    });

    if (ext === '.png') {
      await pipeline.png({ compressionLevel: 9 }).toFile(outputPath);
    } else if (ext === '.webp') {
      await pipeline.webp({ quality: 85 }).toFile(outputPath);
    } else {
      await pipeline.jpeg({ quality: 85 }).toFile(outputPath);
    }

    company.logo = filename;

    return this.repo.save(company);
  }
}
