import { ObjectId } from 'mongoose';

export type PictureDocument = {
	url: string;
	fileName: string;
	index: number;
};

export class Media {
	fileName: string;
	index: number;
	isPrivate: boolean;
	isSafe: boolean;
	url: string;
	_id: ObjectId;
}
