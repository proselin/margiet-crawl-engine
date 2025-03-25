import { Column, Entity } from 'typeorm';
import { CommonEntity } from './common.entity';

@Entity('user')
export class UserEntity extends CommonEntity {
  @Column({
    unique: true,
  })
  email: string;

  @Column({
    nullable: true,
  })
  displayName: string;

  @Column({
    nullable: true,
  })
  avatarUrl: string;

  @Column({
    name: 'supabase_id',
    unique: true,
  })
  supabaseId: string;

  @Column({
    nullable: true,
    default: 'user',
  })
  role: string;

  @Column({
    type: 'boolean',
    default: true,
  })
  isActive: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: Record<string, any>;

  @Column({
    type: 'timestamp',
    nullable: true,
    name: 'last_login',
  })
  lastLogin: Date;
}
