import { Types } from 'mongoose';

export class MediaResponseType {
	fileName: string;
	index: number;
	isPrivate: boolean;
	isSafe: boolean;
	url: string;
	_id: Types.ObjectId;
}

export class UploadUserPictureResponseType {
	pictures: MediaResponseType[];
}
