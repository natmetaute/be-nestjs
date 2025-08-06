import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepo: Repository<User>,
  ) {}

  findAll() {
    return this.usersRepo.find();
  }

  async findById(id: number) {
    const user = await this.usersRepo.findOne({ where: { id } });
    console.log('Looking for ID:', id);
    return user;
  }

  create(user: Partial<User>) {
    const newUser = this.usersRepo.create(user);
    return this.usersRepo.save(newUser);
  }

  async update(id: number, data: Partial<User>) {
    await this.usersRepo.update(id, data);
    return this.findById(id);
  }

  async remove(id: number) {
    await this.usersRepo.delete(id);
    return { deleted: true };
  }

  async findByEmail(email: string) {
    console.log('email:', email);
    return this.usersRepo.findOne({ where: { email } });
  }
}
