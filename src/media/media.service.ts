import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import * as sharp from 'sharp';
import { FastifyRequest } from 'fastify';
import { FileManagerService } from './file-manager.service';
import { CustomHttpService } from '../custom-http/custom-http.service';
import { Types } from 'mongoose';
import { MongoDriverService } from '../mongo-driver/mongo-driver.service';
import { maxPictures } from '../config/config';
import { Media, PictureDocument } from '../types/save-picture.type';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { UrlPictureDto, UrlPicturesDto, VerifyPicturesDto } from './media.dto';

@Injectable()
export class MediaService {
	constructor(
		protected fileUploadService: FileManagerService,
		protected httpService: CustomHttpService,
		protected mongoDriverService: MongoDriverService,
		@Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
	) {
		sharp.cache(false);
	}

	async uploadPictureForPending(req: FastifyRequest, pictures, pendingId: Types.ObjectId): Promise<Media> {
		if (!req.isMultipart()) {
			throw new BadRequestException('REQUEST_IS_NOT_MULTIPART');
		}

		const filesToUploadFiles = [];
		for await (const file of pictures) {
			const savedFileName = this.generateFileName(file.originalname);
			filesToUploadFiles.push({ fileName: savedFileName, file: file.buffer });
		}
		let responseFromPending;
		if (filesToUploadFiles.length > 0) {
			await this.fileUploadService.uploadFiles(filesToUploadFiles);

			// Add picture to pending
			responseFromPending = await this.httpService.post(
				process.env.AUTH_MS_URL,
				process.env.ENDPOINT_SAVE_PICTURE_PENDING + pendingId,
				{
					picture: `${process.env.PICTURE_URL}${filesToUploadFiles[0].fileName}`,
				},
			);
			if (responseFromPending.data.length > 0) {
				const auth = await this.mongoDriverService.findOne('auths', { pending: pendingId });
				this.fileUploadService
					.detectNudity(filesToUploadFiles[0].fileName)
					.catch((reason) => {
						this.logger.log('error', {
							message: reason.message,
							err: JSON.stringify(reason),
							stack: reason.stack,
							context: 'Nudity Check AWS Rekognition',
						});
					})
					.then((value) => {
						this.logger.log('info', 'Got response from AWS Rekognition isSafe: ' + !value);
						this.httpService.post(
							process.env.USER_MS_URL,
							process.env.ENDPOINT_USER_UPDATE_IS_SAFE,
							{
								authId: auth._id,
								pictureId: responseFromPending.data[0]._id,
								isSafe: !value,
							},
							false,
						);
					});
			}
		} else {
			throw new BadRequestException('NO_PICTURE_WAS_PROVIDED');
		}

		return responseFromPending.data;
	}

	async uploadUrlPictureForPending(pending: Types.ObjectId, picture: UrlPictureDto) {
		const responseFromPending = await this.httpService.post(
			process.env.AUTH_MS_URL,
			process.env.ENDPOINT_SAVE_PICTURE_PENDING + pending,
			{
				picture: picture.picture,
				isSafe: true,
			},
		);
		return responseFromPending.data.shift();
	}
	async uploadUrlPictureForUser(user: Types.ObjectId, picturesDto: UrlPicturesDto) {
		const allUserPictures = await this.mongoDriverService.findOne(
			'users',
			{ _id: user },
			{ projection: { pictures: 1 } },
		);

		if (allUserPictures.pictures.some((picture) => picturesDto.indexes.includes(picture.index))) {
			throw new BadRequestException('SOME_INDEXES_ALREADY_USED');
		}
		let responseFromUser;
		const pictureDocs = [];
		if (picturesDto.pictures.length + allUserPictures.pictures.length <= maxPictures) {
			for await (const file of picturesDto.pictures) {
				const fileName = file.split('/').reverse()[0];
				const i = picturesDto.pictures.indexOf(file);
				pictureDocs.push({
					url: file,
					index: picturesDto.indexes[i],
					fileName,
				});
			}
			responseFromUser = await this.httpService.post(
				process.env.USER_MS_URL,
				process.env.ENDPOINT_SAVE_PICTURE_USER + user,
				{
					pictures: pictureDocs,
					isSafe: true,
				},
			);
		} else {
			throw new BadRequestException('PICTURES_LIMIT_EXCEEDED');
		}
		return responseFromUser.data;
	}

	async uploadPictureForUser(
		req: FastifyRequest,
		pictures: any,
		userId: Types.ObjectId,
		allIndexes: number[],
	): Promise<Media> {
		if (!req.isMultipart()) {
			throw new BadRequestException('REQUEST_IS_NOT_MULTIPART');
		}
		if (pictures.length != allIndexes.length)
			throw new BadRequestException('COUNT_OF_PICTURES_AND_INDEXES_SHOULD_BE_EQUAL');
		if (typeof userId == 'string') {
			userId = new Types.ObjectId(userId);
		}
		let responseFromUser;
		if (pictures.length > 0) {
			const allUserPictures = await this.mongoDriverService.findOne(
				'users',
				{ _id: userId },
				{ projection: { pictures: 1 } },
			);
			if (allUserPictures.pictures.some((picture) => allIndexes.includes(picture.index))) {
				throw new BadRequestException('SOME_INDEXES_ALREADY_USED');
			}
			if (pictures.length + allUserPictures.pictures.length <= maxPictures) {
				const filesToUpload = [];
				const pictureDocs: PictureDocument[] = [];
				for await (const file of pictures) {
					const randomValue = Math.floor(Math.random() * 9000) + 1000;
					const fileName = Date.now().toString() + randomValue + '.' + file.originalname.split('.').reverse()[0];
					filesToUpload.push({ fileName: fileName, file: file.buffer });

					const i = pictures.indexOf(file);
					pictureDocs.push({
						url: `${process.env.PICTURE_URL}${fileName}`,
						index: allIndexes[i],
						fileName: fileName,
					});
				}

				// Upload pictures
				if (filesToUpload.length > 0) {
					await this.fileUploadService.uploadFiles(filesToUpload);
					//save picture to User
					responseFromUser = await this.httpService.post(
						process.env.USER_MS_URL,
						process.env.ENDPOINT_SAVE_PICTURE_USER + userId.toString(),
						{
							pictures: pictureDocs,
						},
					);

					if (responseFromUser.data.length > 0) {
						const auth = await this.mongoDriverService.findOne('auths', { user: userId });
						for (const picture of responseFromUser.data) {
							this.fileUploadService
								.detectNudity(picture.fileName)
								.catch((reason) => {
									this.logger.log('error', {
										message: reason.message,
										err: JSON.stringify(reason),
										stack: reason.stack,
										context: 'Nudity Check AWS Rekognition',
									});
								})
								.then(async (isNudity) => {
									await this.httpService.post(
										process.env.USER_MS_URL,
										process.env.ENDPOINT_USER_UPDATE_IS_SAFE,
										{
											authId: auth._id,
											pictureId: picture._id,
											isSafe: !isNudity,
										},
										false,
									);
								});
						}
					}
				}
			} else {
				throw new BadRequestException('PICTURES_LIMIT_EXCEEDED');
			}
		} else {
			throw new BadRequestException('NO_PICTURE_WAS_PROVIDED');
		}

		return responseFromUser.data;
	}

	sendPictureToNsfw(authId: string, pictureId: string, pictureUrl: string) {
		this.httpService
			.get(process.env.NSFW_URL, `?priority=high&user_id=${authId}&photo_id=${pictureId}&url=${pictureUrl}`, {})
			.then((value) =>
				this.logger.log('info', {
					message: 'Added profile picture to NSFW queue',
					response: value.data,
					statusCode: value.status,
					priority: 'high',
					user_id: authId,
					photo_id: pictureId,
					url: pictureUrl,
				}),
			)
			.catch((reason) => this.logger.log('error', { message: 'FAILED TO ADD IMAGE TO NSFW QUEUE', reason: reason }));
	}

	generateFileName(originalFileName): string {
		const randomValue = Math.floor(Math.random() * 9000) + 1000;
		return Date.now().toString() + randomValue + '.' + originalFileName.split('.').reverse()[0];
	}

	async uploadPictureForIdVerification(req: FastifyRequest, pictures, user: Types.ObjectId): Promise<Media> {
		if (!req.isMultipart()) {
			throw new BadRequestException('REQUEST_IS_NOT_MULTIPART');
		}

		const filesToUploadFiles = [];
		for await (const file of pictures) {
			const savedFileName = 'id-verifications/' + this.generateFileName(file.originalname);
			filesToUploadFiles.push({ fileName: savedFileName, file: file.buffer });
		}
		if (filesToUploadFiles.length === 0) throw new BadRequestException('NO_PICTURE_WAS_PROVIDED');

		await this.fileUploadService.uploadFiles(filesToUploadFiles);

		// Add picture to pending
		const responseFromIdVerification = await this.httpService.post(
			process.env.USER_MS_URL,
			process.env.ENDPOINT_USER_CREATE_ID_VERIFICATION,
			{
				user,
				picture: `${process.env.PICTURE_URL}${filesToUploadFiles[0].fileName}`,
			},
		);

		const userData = await this.mongoDriverService.findOne(
			'users',
			{ _id: user },
			{
				projection: {
					pictures: 1,
				},
			},
		);

		const profilePicture = userData.pictures.filter((picture) => picture.index === 0).shift();
		if (!profilePicture) {
			this.logger.log('error', {
				message: 'user does not have a profile picture and requesting id verification',
				user: user._id,
				context: 'Media MS - id verification',
			});
		}
		const similarityScore = await this.fileUploadService.faceSimilarity(
			filesToUploadFiles[0].fileName,
			profilePicture.url.split('/').pop(),
		);
		const poseScore = await this.fileUploadService.thumbsUpScore(filesToUploadFiles[0].fileName);

		await this.httpService.post(
			process.env.USER_MS_URL,
			`${process.env.ENDPOINT_USER_UPDATE_ID_VERIFICATION_STATUS}/${user.toString()}/update-scores`,
			{
				poseScore,
				similarityScore,
			},
		);

		return responseFromIdVerification.data;
	}

	async uploadPictureForConversation(
		req: FastifyRequest,
		pictures,
		sender: Types.ObjectId,
		conversation: Types.ObjectId,
		destination: Types.ObjectId,
	): Promise<Media> {
		if (!req.isMultipart()) {
			throw new BadRequestException('REQUEST_IS_NOT_MULTIPART');
		}

		const filesToUploadFiles = [];
		for await (const file of pictures) {
			const savedFileName = `conversations/${conversation.toString()}/` + this.generateFileName(file.originalname);
			filesToUploadFiles.push({ fileName: savedFileName, file: file.buffer });
		}
		if (filesToUploadFiles.length === 0) throw new BadRequestException('NO_FILE_WAS_PROVIDED');

		await this.fileUploadService.uploadFiles(filesToUploadFiles);

		const message = {
			conversation: conversation,
			destination: destination,
			sender,
			picture: `${process.env.PICTURE_URL}${filesToUploadFiles[0].fileName}`,
		};
		// Add picture to chat
		const responseFromChat = await this.httpService.post(
			process.env.CHAT_MS_URL,
			process.env.ENDPOINT_CHAT_SEND_PICTURE,
			message,
		);

		return responseFromChat.data;
	}
	async verifyPictures(id: Types.ObjectId, verifyPictures: VerifyPicturesDto): Promise<void> {
		const similarityScore = await this.fileUploadService.faceSimilarity(
			verifyPictures.profilePicture,
			verifyPictures.idVerificationPicture,
		);
		await this.httpService.post(process.env.USER_MS_URL, process.env.ENDPOINT_USER_CREATE_ID_VERIFICATION, {
			user: id,
			picture: verifyPictures.idVerificationPicture,
			similarityScore,
			poseScore: verifyPictures.poseScore,
		});
	}
}
