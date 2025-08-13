import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository, Like } from 'typeorm';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { Company } from 'src/company/company.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
    @InjectRepository(Company)
    private readonly companyRepo: Repository<Company>,
  ) {}

  findAll() {
    return this.usersRepo.find();
  }

async findAllWithFilters(
  page = 1,
  limit = 10,
  search?: string,
): Promise<{ data: User[]; total: number }> {
  const where = search
  ? [
      { firstName: Like(`%${search}%`) },
      { lastName: Like(`%${search}%`) }
    ]
  : [];

    const queryBuilder = this.usersRepo.createQueryBuilder('users')                
    .where(where);   

    const result = await queryBuilder
    .skip((page - 1) * limit)  
    .take(limit)               
    .getRawAndEntities();    

  const entities = result.entities; 
  const raw = result.raw;  

  if (!Array.isArray(entities) || !Array.isArray(raw)) {
    throw new Error("Expected entities and raw data to be arrays.");
  }

  const mappedData = entities.map((users) => ({
    ...users,                        
  }));

    const total = await this.usersRepo.createQueryBuilder('users')
    .where(where)  
    .getCount();

  return { data: mappedData , total};
}

    async findAllByCompany(companyId: number): Promise<User[]> {
    return this.usersRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company') 
      .where('user.companyId = :companyId', { companyId }) 
      .getMany(); 
  }

  async findById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });

    return user;
  }

  async create(dto: CreateUserDto): Promise<User> {
    const company = await this.companyRepo.findOne({
      where: { id: dto.companyId },
    });
    if (!company) throw new BadRequestException('Company does not exist');

    const user = this.usersRepo.create({
      ...dto,
      company,
      password: await bcrypt.hash(dto.password, 10),
    });

    return this.usersRepo.save(user);
  }

  async update(id: number, data: Partial<User>) {
    await this.usersRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number) {
    await this.usersRepo.delete(id);
    return { deleted: true };
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepo.findOne({ where: { email }, relations: ['company'] });
  }

  async findByEmailAndCompany(
    email: string,
    companyId: number,
  ): Promise<User | null> {
    return this.usersRepo.findOne({
      where: { email, companyId },
      relations: ['company'],
    });
  }
}
