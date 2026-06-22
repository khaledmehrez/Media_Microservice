import { Db, Filter, FindOptions } from 'mongodb';
import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';

@Injectable()
export class MongoDriverService {
	constructor(@Inject('DATABASE_CONNECTION') private db: Db) {}

	async find(collection: string, filter: Filter<any>, options?: FindOptions): Promise<any> {
		try {
			return this.db.collection(collection).find(filter, options).toArray();
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}

	async findOne(collection: string, filter: Filter<any>, options?: FindOptions): Promise<any> {
		try {
			return this.db.collection(collection).findOne(filter, options);
		} catch (e) {
			throw new InternalServerErrorException(e);
		}
	}
}
