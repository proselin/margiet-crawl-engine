import { IBaseCurl } from '@/common';
import { Logger, NotFoundException } from '@nestjs/common';
import {
  FilterQuery,
  HydratedDocument,
  Model,
  MongooseUpdateQueryOptions,
  ProjectionType,
  QueryOptions,
  UpdateQuery,
  UpdateWithAggregationPipeline,
} from 'mongoose';

export abstract class BaseCurdService<Entity extends Record<string, any>>
  implements IBaseCurl<Entity>
{
  protected logger: Logger;
  protected model: Model<Entity>;

  protected constructor(logger: Logger, model: Model<Entity>) {
    this.logger = logger;
    this.model = model;
  }

  async findOne(
    filter?: FilterQuery<Entity>,
    projection?: ProjectionType<Entity> | null,
    options?: QueryOptions<Entity> | null,
  ) {
    return this.model.findOne(filter, projection, options).exec();
  }

  async updateOne(
    filter?: FilterQuery<Entity>,
    update?: UpdateQuery<Entity> | UpdateWithAggregationPipeline,
    options?: (Record<string, any> & MongooseUpdateQueryOptions<Entity>) | null,
  ) {
    return this.model.updateOne(filter, update, options).exec();
  }

  // Create
  async createOne(createDto: Entity | Record<any, any>) {
    const createdEntity = await this.model.insertMany([createDto]);
    return <HydratedDocument<Entity>>createdEntity[0];
  }

  // Read (Find All)
  async findAll() {
    const entities = await this.model.find().exec();
    this.logger.log(`Found ${entities.length} entities`);
    return entities;
  }

  // Read (Find One by ID)
  async findById(
    id: string,
    projection?: ProjectionType<any>,
    opts?: QueryOptions<any>,
  ): Promise<HydratedDocument<Entity>> {
    const entity = await this.model.findById(id, projection, opts).exec();
    if (!entity) {
      this.logger.warn(`Entity with ID ${id} not found`);
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return entity;
  }

  // Update
  async findByIdAndUpdate(
    id: any,
    updateDto: UpdateQuery<Entity>,
    opts?: QueryOptions<Entity> & { includeResultMetadata: true; lean: true },
  ): Promise<HydratedDocument<Entity>> {
    const updatedEntity = await this.model
      .findByIdAndUpdate(id, updateDto, opts)
      .exec();
    if (!updatedEntity) {
      this.logger.warn(`Entity with ID ${id} not found for update`);
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    return updatedEntity as unknown as HydratedDocument<Entity>;
  }

  // Delete
  async remove(id: string, opts?: QueryOptions<any>): Promise<boolean> {
    const result = await this.model
      .findOneAndDelete(
        {
          _id: id,
        },
        opts,
      )
      .exec();
    if (!result) {
      this.logger.warn(`Entity with ID ${id} not found for deletion`);
      throw new NotFoundException(`Entity with ID ${id} not found`);
    }
    this.logger.log(`Entity with ID ${id} deleted`);
    return !!result;
  }

  async findAndUpdate(
    condition: FilterQuery<any>,
    updateDto: Record<string, any>,
    opts?: QueryOptions<any>,
  ): Promise<Entity & HydratedDocument<Entity>> {
    const updatedEntity = await this.model
      .findOneAndUpdate(condition, updateDto, opts)
      .exec();
    if (!updatedEntity) {
      this.logger.warn(
        `Entity with condition ${JSON.stringify(condition)} not found for update or create`,
      );
      throw new NotFoundException(
        `Entity with condition ${JSON.stringify(condition)} not found`,
      );
    }
    return updatedEntity;
  }

  async findOrCreate(
    conditionOrData: Record<string, any>,
    projection: Record<string, any> = {},
  ): Promise<Entity & HydratedDocument<Entity>> {
    const existedEntity = await this.model
      .findOne(conditionOrData, projection)
      .exec();
    if (!existedEntity) {
      this.logger.warn(
        `Entity with data ${conditionOrData} not found. create new one !`,
      );
      const rs = await this.createOne(conditionOrData);
      this.logger.log(
        `Entity is create with id ${<Entity & HydratedDocument<Entity>>rs.id}`,
      );
      return <Entity & HydratedDocument<Entity>>rs;
    }
    return existedEntity;
  }
}
