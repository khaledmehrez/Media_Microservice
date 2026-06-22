import { BadRequestException } from '@nestjs/common';
import { Readable } from 'stream';
import * as crypto from 'crypto';

export const imageFileFilter = (req: Request, file: any, callback) => {
	if (!file.originalname.match(/\.(jpg|jpeg|png|gif|webp)$/)) {
		return callback(new BadRequestException(' ONLY_IMAGES_ARE_ALLOWED'), false);
	}
	callback(null, true);
};

export const bufferToStream = (binary) => {
	return new Readable({
		read() {
			this.push(binary);
			// null behaves as EOF for stream
			this.push(null);
		},
	});
};

export async function hashFileName(fileName: string) {
	//create array that contain filename and ext
	const arrayImageNameAndExt = fileName.split('.');

	const pictureName = arrayImageNameAndExt[0];
	const pictureExt = arrayImageNameAndExt[1];

	// generate randomValue between 0 an 10000
	const randomValue = Math.floor(Math.random() * 9000) + 1000;

	//create hashed picture name
	const hash = crypto
		.createHash('sha256')
		.update(pictureName + randomValue)
		.digest('base64');

	return hash.replace(/[$\/]/g, 'a') + '.' + pictureExt;
}
