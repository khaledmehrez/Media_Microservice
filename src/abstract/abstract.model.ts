import { Document } from 'mongoose';

export abstract class AbstractModel extends Document {
	createdAt?: Date;

	updatedAt?: Date;

	id?: string;
}
