import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export class MediaResponse {
	@ApiProperty()
	fileName: string;

	@ApiProperty()
	index: number;

	@ApiProperty()
	isPrivate: boolean;

	@ApiProperty()
	isSafe: boolean;

	@ApiProperty()
	url: string;

	@ApiProperty({ example: '620e8d90b0e39c526a84a87b' })
	_id: Types.ObjectId;
}

export class VerificationResponse {
	@ApiProperty({ example: 1 })
	status: number;

	@ApiProperty()
	picture: string;

	@ApiProperty({ example: '625fe325aa5f1648d298d36b' })
	user: Types.ObjectId;

	@ApiProperty({ example: '620e8d90b0e39c526a84a87b' })
	_id: Types.ObjectId;
}
export class ChatResponse {
	@ApiProperty({ example: new Types.ObjectId() })
	sender: Types.ObjectId;

	@ApiProperty({ example: new Types.ObjectId() })
	destination: Types.ObjectId;

	@ApiProperty()
	picture: string;

	@ApiProperty({ example: new Types.ObjectId() })
	conversation: Types.ObjectId;

	@ApiProperty({ example: new Types.ObjectId() })
	_id: Types.ObjectId;

	@ApiProperty({ example: false })
	isDelivered: boolean;

	@ApiProperty({ example: [] })
	reactions: [];
}

export class UploadUserPictureResponse {
	@ApiProperty({ type: [MediaResponse] })
	pictures: MediaResponse[];
}
