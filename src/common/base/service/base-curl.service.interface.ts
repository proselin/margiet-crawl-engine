import { HydratedDocument, QueryOptions } from 'mongoose';

export interface IBaseCurl<Entity = Record<string, any>> {
  createOne(createDto: Record<string, any>): Promise<HydratedDocument<Entity>>;

  findAll(): Promise<Array<HydratedDocument<Entity>>>;

  findById(
    id: string | number | object,
    opts?: QueryOptions<any>,
  ): Promise<HydratedDocument<Entity>>;

  findByIdAndUpdate(
    id: string | number | object,
    updateDto: Record<string, any>,
    opts?: QueryOptions<any>,
  ): Promise<HydratedDocument<Entity>>;

  remove(id: string | number | object): Promise<boolean>;
}
