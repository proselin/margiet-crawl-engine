import { HydratedDocument, QueryOptions } from 'mongoose';

export interface IBaseCurl<Entity = any> {
  createOne(
    createDto: Record<string, any>,
  ): Promise<Entity & HydratedDocument<Entity>>;

  findAll(): Promise<Array<Entity & HydratedDocument<Entity>>>;

  findById(
    id: string | number | object,
    opts?: QueryOptions<any>,
  ): Promise<Entity & HydratedDocument<Entity>>;

  findByIdAndUpdate(
    id: string | number | object,
    updateDto: Record<string, any>,
    opts?: QueryOptions<any>,
  ): Promise<Entity & HydratedDocument<Entity>>;

  remove(id: string | number | object): Promise<boolean>;
}
