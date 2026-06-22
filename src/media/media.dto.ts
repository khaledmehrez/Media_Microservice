import {
	ArrayMaxSize,
	ArrayNotEmpty,
	ArrayUnique,
	IsArray,
	IsMongoId,
	IsNotEmpty,
	IsNumber,
	IsString,
	Max,
	Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import { maxPictures } from '../config/config';

export class UploadPictureDto {
	@Transform((obj) =>
		typeof obj.value === 'string' && obj.value.startsWith('[') && obj.value.endsWith(']')
			? JSON.parse(obj.value)
			: obj.value,
	)
	@IsArray()
	@IsNotEmpty()
	@ArrayUnique()
	@IsNumber({ allowNaN: false }, { each: true })
	@Min(0, { each: true })
	@Max(maxPictures - 1, { each: true })
	allIndexes: number[];
}

export class PictureDto {
	@IsString()
	fieldname: string;

	@IsString()
	originalname: string;

	@IsString()
	encoding: string;

	@IsString()
	mimetype: string;

	buffer: any;

	@IsNumber()
	size: number;
}

export class VerifyPicturesDto {
	@IsNotEmpty()
	@IsString()
	profilePicture: string;

	@IsNotEmpty()
	@IsString()
	idVerificationPicture: string;

	@ApiProperty({ example: 60 })
	@IsNumber()
	poseScore: number;
}

export class DestinationDto {
	@IsNotEmpty()
	@IsMongoId()
	@ApiProperty({ type: ObjectId, example: new Types.ObjectId() })
	destination: Types.ObjectId;
}

export class UrlPictureDto {
	@IsNotEmpty()
	@IsString()
	@ApiProperty({
		example: 'https://example.com/picture',
	})
	picture: string;
}
export class UrlPicturesDto {
	@ApiProperty()
	@ArrayNotEmpty()
	@ArrayMaxSize(maxPictures)
	@ArrayUnique()
	pictures: string[];

	@IsArray()
	@ApiProperty({ example: [0, 1, 2, 3, 4] })
	@IsNotEmpty()
	@ArrayUnique()
	@IsNumber({ allowNaN: false }, { each: true })
	@Min(0, { each: true })
	@Max(maxPictures - 1, { each: true })
	indexes: number[];
}
