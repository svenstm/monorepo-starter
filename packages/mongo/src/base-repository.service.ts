import { DocumentType, Ref, ReturnModelType } from '@typegoose/typegoose';
import { AnyParamConstructor } from '@typegoose/typegoose/lib/types';
import moment from 'moment-timezone';
import mongoose, { FilterQuery, PipelineStage, PopulateOptions, QueryOptions, SortOrder } from 'mongoose';
import { escapeRegExp } from '@monorepo-starter/utils';
import { isDocTypeOf, referenceToBson, referenceToId } from './utils';
import { ModelRef } from './reference.typing';

export type Writeable<T> = { -readonly [P in keyof T]: T[P] };
type DeepPartial<T> = { [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]; };
type DateKeys<Key> = `${'from' | 'to'}_${Lowercase<Key extends string ? Key : never>}`;
type GetDateKeys<T> = keyof {
  [P in keyof T]: T extends Date ? T[P] : never
};

export type ToQueryObject<T> = Partial<{
  [P in keyof T]?: T[P] extends Ref<infer A> ? string | Ref<A> | DocumentType<A> : T[P]
} & {
  [P in DateKeys<GetDateKeys<T>>]?: string | Date;
}>

export abstract class BaseRepositoryService<T extends { initialize: () => DocumentType<T> },
  U extends AnyParamConstructor<T> = AnyParamConstructor<T>> {

  abstract get populate(): PopulateOptions[];

  constructor(
    protected readonly model: ReturnModelType<U>
  ) {}

  new(data: Partial<T>): DocumentType<T> {
    return new this.model(data).initialize();
  }

  async save(doc: DocumentType<T>): Promise<DocumentType<T>> {
    return (await doc.save())
      .populate(this.populate);
  }

  markAsNew(doc: DocumentType<T>) {
    doc.isNew = true;
    doc._id = new mongoose.Types.ObjectId();
    doc.id = doc._id;
  }

  async find(filter: any, populate?: PopulateOptions[]): Promise<DocumentType<T>> {
    const result = await this.model.findOne(filter)
      .populate(populate ?? this.populate) as DocumentType<T>;

    return result && result.initialize();
  }

  async findAll(
    filter: any,
    sort: any = '-created',
    limit: number | string = 25,
    skip: number | string = 0,
    search?: string,
    populate?: PopulateOptions[],
  ): Promise<DocumentType<T>[]> {
    let query = filter;
    if (search) {
      const searchQuery = this.getSubpartsQuery(search);
      if (searchQuery) {
        query = {
          $and: [
            searchQuery,
            filter,
          ]
        };
      }
    }

    let result = await this.model.find(query)
      .sort(sort)
      .limit(Number(limit))
      .skip(Number(skip))
      .populate(populate ?? this.populate) as DocumentType<T>[];

    if (search && result.length === 0) {
      query = {
        $text: {$search: search},
        ...filter,
      };

      result = await this.model.find(query)
        .sort(sort)
        .limit(Number(limit))
        .skip(Number(skip))
        .populate(populate ?? this.populate) as DocumentType<T>[];
    }

    return result.map((item) => item.initialize());
  }

  findAllRaw(
    filter: any,
    populate?: PopulateOptions[],
    sort?: string | Record<string, SortOrder>,
  ) {
    const query = this.model.find<DocumentType<T>>(filter);

    if (sort) {
      query.sort(sort);
    }

    if (populate) {
      query.populate(populate);
    }

    return query;
  }

  findAllByPaging(
    filter: any,
    sort: any = '-created',
    limit = 25,
    populate?: PopulateOptions[],
  ) {
    const repo = this;

    return {
      async *[Symbol.asyncIterator](): AsyncIterableIterator<DocumentType<T>> {
        const count = await repo.count(filter);
        for(let skip = 0; skip<count; skip+=limit) {
          const data = await repo.findAll(filter, sort, limit, skip, undefined, populate)
          yield *data;
        }
      }
    }
  }

  async fromReference(ref: ModelRef<T>): Promise<DocumentType<T>> {
    // is reference to nothing, return nothing
    if (ref === undefined || ref === null) return undefined;
    // If it's already a model
    if (isDocTypeOf(this.model, ref as any)) return ref as DocumentType<T>;
    // if it's a reference
    return await this.find({_id: referenceToId(ref)});
  }

  async findOneAndUpdate(
    filter: FilterQuery<T>,
    update: any,
    options: QueryOptions = {new: true},
  ) {
    const result = this.model.findOneAndUpdate(
      filter,
      update,
      options,
    );

    result.populate(this.populate);

    return result;
  }

  async count(filter: FilterQuery<T>, search?: string): Promise<number> {
    let query = filter;
    if (search) {
      const searchQuery = this.getSubpartsQuery(search);
      if (searchQuery) {
        query = {
          $and: [
            searchQuery,
            filter,
          ]
        };
      }
    }
    let result = await this.model.countDocuments({...query});
    if (search && !result) {
      query = {
        $and: [
          {$text: {$search: search}},
          filter,
        ]
      };
      result = await this.model.countDocuments({...query});
    }
    return result;
  }

  async exists(filter: any): Promise<boolean> {
    const result = await this.model.exists(filter);
    return Boolean(result);
  }

  async delete(filter: any): Promise<boolean> {
    const result = await this.model.deleteOne(filter);
    return result.acknowledged;
  }

  async deleteAll(filter: any): Promise<boolean> {
    const result = await this.model.deleteMany(filter);
    return result.acknowledged;
  }

  async aggregate(
    aggregations: PipelineStage[],
    options: {
      limit?: string | number,
      skip?: string | number,
      sort?: string | Record<string, SortOrder>,
    } = {},
    populate?: PopulateOptions[],
  ): Promise<any[]> {
    let aggregate = this.model.aggregate(aggregations);

    if (options.sort) {
      aggregate = aggregate.sort(options.sort);
    }

    if (options.limit) {
      aggregate = aggregate.limit(Number(options.limit) + Number(options.skip))
        .skip(Number(options.skip));
    }

    const result = await aggregate.exec();

    if (populate) {
      return this.model.populate(result, populate);
    }
    return result;
  }

  aggregateRaw<R>(
    aggregations: PipelineStage[],
    sort?: string | Record<string, SortOrder>,
  ) {
    let aggregate = this.model.aggregate<R>(aggregations);

    if (sort) {
      aggregate.sort(sort);
    }

    return aggregate;
  }

  getPropOptions() {

    // Mongoose is bad with abstraction, so prop fields are only stored of the parent.
    // Normally you can request all @prop data with `this.model.schema.obj`, but since that doesnt have the child classes
    // generate this blob in hacky code
    const {paths} = this.model.schema;
    return Object.keys(paths).reduce((acc, key) => {
      acc[key] = Object.assign({}, paths[key].options);
      return acc;
    }, {} as DeepPartial<typeof paths>)
  }

  protected getSubpartsQuery(search?: string): FilterQuery<T> {
    if (!search) {
      return;
    }

    const query = this.buildSearchQuery(search, this.getPropOptions());

    if (query.$or.length === 0) {
      return;
    }

    return query;
  }

  protected buildSearchQuery(search: string, obj: object, fieldParent?: string, query = {$or: []} as FilterQuery<T>) {
    for (const [name, field] of Object.entries<any>(obj)) {
      const key = fieldParent ? `${fieldParent}.${name}` : name;

      if (field.text) {
        let customKey = key as any;

        // It's preferable to check the type and match it with TranslationMessage,
        // but it's not stored in the this.model or schema, so checking if starts with translated_ is the only way
        if (field.type && name.startsWith('translated_')) {
          customKey += '.value';
        }

        query.$or.push({
          [customKey]: new RegExp(escapeRegExp(search), 'gi')
        });
      }

      if (field.type?.obj) {
        this.buildSearchQuery(search, field.type.obj, key, query);
      }
    }

    return query;
  }

  findWithType(filter: FilterQuery<T>) {
    return this.find(filter);
  }

  async findOneOrUpsert(filter: FilterQuery<T>, update: any,): Promise<DocumentType<T>> {
    // ToDo; when upgrading to new version of mongoose, use returnDocument: 'after' instead of new
    // https://stackoverflow.com/a/43474183/16748954 However, now the propery new is needed
    // Redundant await because of thenable not promise
    return this.model.findOneAndUpdate(filter, update, {upsert: true, new: true});
  }

  static isEqual<R extends Ref<DocumentType<any>>>(...test: R[]) {
    return test.map(referenceToId)
      .every((value, _, self) => self[0] && self[0] === value);
  }

  queryBetween(from: string, to: string ,timezone: string) {
    return {
      $gte: moment.tz(from, timezone).startOf('day').toDate(),
      $lte: moment.tz(to, timezone).endOf('day').toDate(),
    }
  }

  queryToFilterDateField(field: string, filter: any, query: any, timezone: string) {
    if (query['from_' + field] || query['to_' + field]) {
      if (query['from_' + field]) {
        filter[field] = {$gte: moment.tz(query['from_' + field], timezone).startOf('day').toDate()};
      }

      if (query['to_' + field]) {
        filter[field] = {
          ...filter[field],
          $lte: moment.tz(query['to_' + field], timezone).endOf('day').toDate()
        };
      }
    }
  }

  queryToFilter(query: ToQueryObject<T>, timezone: string) {
    const filter: FilterQuery<Writeable<T>> = {};

    // Get a list of all defined schema props
    const props = this.getPropOptions();
    const doneProps = new Set<string>();

    // All easy to convert props
    Object.keys(props)
      .filter(k => query.hasOwnProperty(k))
      .forEach((key) => {
        ((filter as any)[key]) = referenceToId((query as any)[key]);
        doneProps.add(key);
      });

    // Deal with date objects
    Object.keys(props)
      .filter((key) => (props[key] as any).type === Date)
      .forEach(key => this.queryToFilterDateField(key, filter, query, timezone));

    return filter;
  }

  repopulate(doc: DocumentType<T>, populate?: PopulateOptions[]): Promise<DocumentType<T>> {
    return doc.populate(populate ?? this.populate);
  }

  createCopy(existing: T | DocumentType<T>) {
    const props = this.getPropOptions();
    const data: Partial<T> = {};
    for(const [key, options] of Object.entries(props)) {
      // Most models don't have an _id field, but some like country override mongooses default
      if (key === '_id') continue;

      if (options.ref) {
        data[key] = referenceToBson(existing[key]);
      } else {
        data[key] = existing[key];
      }
    }

    return this.new(data);
  }

  async reload(model: DocumentType<T>) {
    const props = this.getPropOptions();

    // Note this doesn't populate
    const fresh = await this.model.findOne({_id: model._id});
    if (!fresh) {
      return
    }
    for(const [key, options] of Object.entries(props)) {

      // exclude overriding id and modified props
      if (key === '_id') {
        continue;
      }

      // for arrays blindly copy as it's hard to detect changes
      const isArray = Array.isArray(model[key]) || Array.isArray(fresh[key]);
      if (isArray) {
        model[key] = fresh[key];
        continue;
      }

      if (options.ref && (model[key]||fresh[key])) {
        model[key] = fresh[key] ? fresh[key] : undefined;
        continue;
      }

      // Note; objects will always be overridden entirely as they are other objects
      if (model[key] !== fresh[key]) {
        model[key] = fresh[key];
      }
    }
  }
}
