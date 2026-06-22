import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { S3, Rekognition } from 'aws-sdk';
import * as fs from 'fs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Injectable()
export class FileManagerService {
	private s3: S3;
	private rekognition: Rekognition;

	constructor(@Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {
		this.s3 = new S3({
			credentials: {
				accessKeyId: process.env.ACCESS_KEY,
				secretAccessKey: process.env.SECRET,
			},
			region: process.env.REGION,
		});

		this.rekognition = new Rekognition({
			region: process.env.REGION,
			credentials: {
				accessKeyId: process.env.ACCESS_KEY,
				secretAccessKey: process.env.SECRET,
			},
		});
	}

	async uploadFiles(files: { fileName: string; file: Buffer }[]): Promise<void> {
		const promises = [];

		for (const file of files) {
			promises.push(
				this.s3
					.putObject(
						{
							Bucket: process.env.BUCKET,
							Key: file.fileName,
							Body: file.file,
							ACL: 'public-read',
						},
						(err, data) => {
							if (err) {
								this.logger.error('UPLOAD_TO_S3_FAILED', err);
								throw new InternalServerErrorException('UPLOAD_TO_S3_FAILED');
							} else {
								this.logger.log('info', 'FILE_UPLOADED', file.fileName, data);
							}
						},
					)
					.promise(),
			);
		}
		await Promise.all(promises);
	}

	async detectNudity(fileName: string): Promise<boolean> {
		const now = Date.now();
		const result = await this.rekognition
			.detectModerationLabels({ Image: { S3Object: { Name: fileName, Bucket: process.env.BUCKET } } })
			.promise();
		this.logger.log('info', 'NUDITY CHECK ' + (Date.now() - now));
		return result.ModerationLabels.some((value) => {
			return (value.Name === 'Nudity' || value.Name === 'Explicit Nudity') && value.Confidence > 80;
		});
	}

	async faceSimilarity(sourceImage: string, targetImage: string): Promise<number> {
		try {
			const result = await this.rekognition
				.compareFaces({
					SourceImage: { S3Object: { Name: sourceImage, Bucket: process.env.BUCKET } },
					TargetImage: { S3Object: { Name: targetImage, Bucket: process.env.BUCKET } },
					SimilarityThreshold: 50,
				})
				.promise();
			return result?.FaceMatches?.shift()?.Similarity ?? 0;
		} catch (e) {
			return 0;
		}
	}

	async thumbsUpScore(sourceImage: string): Promise<number> {
		try {
			const result = await this.rekognition
				.detectLabels({
					Image: { S3Object: { Name: sourceImage, Bucket: process.env.BUCKET } },
				})
				.promise();
			return result?.Labels?.filter((label) => label.Name === 'Thumbs Up').shift()?.Confidence ?? 0;
		} catch (e) {
			return 0;
		}
	}

	async deleteFile(fileName: string): Promise<void> {
		await this.s3.deleteObject({ Bucket: process.env.BUCKET, Key: fileName }, (err) => {
			if (err) this.logger.error('PICTURE_DELETION_FROM_BUCKET_FAILED');
		});
	}

	async deleteFileLocally(files: string[], msg: string[]) {
		for (const fileName of files) {
			const i = files.indexOf(fileName);

			fs.rm(process.env.LOCAL_FOLDER + fileName, (err) => {
				if (err) this.logger.error(err.message, err.stack, msg[i]);
			});
		}
	}
}
