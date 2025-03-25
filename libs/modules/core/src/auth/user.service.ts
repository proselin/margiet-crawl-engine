import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserEntity } from '@shared/database/entities/user.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(UserEntity)
    private userRepository: Repository<UserEntity>,
  ) {}

  async findBySupabaseId(supabaseId: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { supabaseId } });
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async createUser(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async updateUser(id: string, userData: Partial<UserEntity>): Promise<UserEntity> {
    await this.userRepository.update(id, userData);
    return this.userRepository.findOne({ where: { id: +id } });
  }
}
