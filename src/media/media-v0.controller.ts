import {
	Body,
	Controller,
	Param,
	Post,
	Query,
	Req,
	UploadedFiles,
	UseGuards,
	UseInterceptors,
	VERSION_NEUTRAL,
} from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiExtraModels, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ResponseObject } from '../abstract/response.object';
import { MediaService } from './media.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import {
	DestinationDto,
	PictureDto,
	UploadPictureDto,
	UrlPictureDto,
	UrlPicturesDto,
	VerifyPicturesDto,
} from './media.dto';
import { maxPictures } from '../config/config';
import { imageFileFilter } from '../utils/utils';
import { FilesFastifyInterceptor } from 'fastify-file-interceptor';
import {
	ChatResponse,
	MediaResponse,
	UploadUserPictureResponse,
	VerificationResponse,
} from '../api-doc/dtos/response-media.dto';
import { CustomApiBadRequestResponse, CustomApiCreatedResponse } from '../api-doc/api-response-schema';
import { MediaResponseType, UploadUserPictureResponseType } from '../types/responses/response-media.type';
import { Types } from 'mongoose';

@Controller({ path: 'media', version: ['0', VERSION_NEUTRAL] })
@ApiTags('Media')
export class MediaControllerV0 {
	constructor(private mediaService: MediaService) {}

	@ApiOperation({
		operationId: 'Upload picture for pending ',
		description: 'Enables a pending to upload a picture  ',
		summary: 'Upload Pending Picture',
	})
	@ApiExtraModels(MediaResponse)
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('Pending upload response', 'PICTURE_UPLOADED', MediaResponse, true)
	@CustomApiBadRequestResponse('Pending upload Bad Request  response', [
		'REQUEST_IS_NOT_MULTIPART',
		'NO_PICTURE_WAS_PROVIDED',
	])
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FilesFastifyInterceptor('pictures', 1, { fileFilter: imageFileFilter }))
	@Post('pending/uploads')
	async uploadPictureForPending(
		@Req() req,
		@UploadedFiles() pictures: PictureDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.uploadPictureForPending(req, pictures, req.auth.pending);
		return new ResponseObject('PICTURE_UPLOADED', data);
	}

	@ApiOperation({
		operationId: 'Upload picture for user ',
		description: 'Enables a user to upload a picture  ',
		summary: 'Upload user Picture',
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'array',
					format: 'binary',
				},
				allIndexes: {
					type: 'array of numbers',
					description: 'used to add indexes for every pictures uploaded **min length=0**, **max length=8**',
				},
			},
		},
	})
	@ApiExtraModels(MediaResponse, UploadUserPictureResponse)
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('User upload response', 'PICTURE_UPLOADED', UploadUserPictureResponse)
	@CustomApiBadRequestResponse('User upload Bad Request  response', [
		'REQUEST_IS_NOT_MULTIPART',
		'COUNT_OF_PICTURES_AND_INDEXES_SHOULD_BE_EQUAL',
		'SOME_INDEXES_ALREADY_USED',
		'PICTURES_LIMIT_EXCEEDED',
		'NO_PICTURE_WAS_PROVIDED',
	])
	@UseGuards(JwtAuthGuard)
	@Post('user/uploads')
	@UseInterceptors(FilesFastifyInterceptor('pictures', maxPictures, { fileFilter: imageFileFilter }))
	async uploadPictureForUser(
		@UploadedFiles() pictures: PictureDto[],
		@Req() req: any,
		@Body() uploadPicturesDto: UploadPictureDto,
	): Promise<ResponseObject<UploadUserPictureResponseType>> {
		const data = await this.mediaService.uploadPictureForUser(
			req,
			pictures,
			req.auth.user,
			uploadPicturesDto.allIndexes,
		);

		return new ResponseObject('PICTURES_UPLOADED', data);
	}

	@ApiOperation({
		operationId: 'Add an url picture for pending',
		description: 'Enables a pending to add an url picture  ',
		summary: 'Add an URL Pending Picture',
	})
	@ApiExtraModels(MediaResponse)
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('Pending upload response', 'PICTURE_UPLOADED', MediaResponse, true)
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FilesFastifyInterceptor('pictures', 1, { fileFilter: imageFileFilter }))
	@Post('pending-url/uploads')
	async uploadUrlPictureForPending(
		@Req() req,
		@Body() picture: UrlPictureDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.uploadUrlPictureForPending(req.auth.pending, picture);
		return new ResponseObject('PICTURE_ADDED', data);
	}

	@ApiOperation({
		operationId: 'Add an url picture for user',
		description: 'Enables a user to add an url picture  ',
		summary: 'Add an URL Picture for User',
	})
	@ApiExtraModels(MediaResponse, UploadUserPictureResponse)
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('User upload response', 'PICTURE_UPLOADED', UploadUserPictureResponse)
	@CustomApiBadRequestResponse('User upload Bad Request  response', [
		'SOME_INDEXES_ALREADY_USED',
		'PICTURES_LIMIT_EXCEEDED',
	])
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FilesFastifyInterceptor('pictures', 1, { fileFilter: imageFileFilter }))
	@Post('user-url/uploads')
	async uploadUrlPictureForUser(
		@Req() req,
		@Body() picture: UrlPicturesDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.uploadUrlPictureForUser(req.auth.user, picture);
		return new ResponseObject('PICTURES_ADDED', data);
	}

	@ApiOperation({
		operationId: 'Upload Id Verification picture for user ',
		description: 'Enables Id Verification a user to upload a picture  ',
		summary: 'Upload user Id Verification Picture',
	})
	@ApiExtraModels(VerificationResponse)
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('Id Verification upload response', 'PICTURE_UPLOADED', VerificationResponse)
	@CustomApiBadRequestResponse('Id Verification Bad Request  response', [
		'REQUEST_IS_NOT_MULTIPART',
		'NO_PICTURE_WAS_PROVIDED',
	])
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FilesFastifyInterceptor('pictures', 1, { fileFilter: imageFileFilter }))
	@Post('id-verification/uploads')
	async uploadPictureForIdVerification(
		@Req() req,
		@UploadedFiles() pictures: PictureDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.uploadPictureForIdVerification(req, pictures, req.auth.user);
		return new ResponseObject('PICTURE_UPLOADED', data);
	}

	@ApiOperation({
		operationId: 'Upload  picture into a conversation',
		description: 'Enables a user to upload a picture into a conversation',
		summary: 'Upload  picture into a conversation ',
	})
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				pictures: {
					type: 'string',
					format: 'binary',
				},
			},
		},
	})
	@ApiExtraModels(ChatResponse)
	@ApiConsumes('multipart/form-data')
	@CustomApiCreatedResponse('Chat upload picture response', 'PICTURE_UPLOADED', ChatResponse)
	@CustomApiBadRequestResponse('Chat upload picture Bad Request  response', [
		'REQUEST_IS_NOT_MULTIPART',
		'NO_FILE_WAS_PROVIDED',
	])
	@UseGuards(JwtAuthGuard)
	@UseInterceptors(FilesFastifyInterceptor('pictures', 1, { fileFilter: imageFileFilter }))
	@Post('chat/:conversation/upload-file')
	async uploadPictureForConversation(
		@Req() req,
		@Query() destination: DestinationDto,
		@Param('conversation') conversation: Types.ObjectId,
		@UploadedFiles() pictures: PictureDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.uploadPictureForConversation(
			req,
			pictures,
			req.auth.user,
			conversation,
			destination.destination,
		);
		return new ResponseObject('PICTURE_UPLOADED', data);
	}

	@Post('re-verify-pictures/:id')
	async verifyPictures(
		@Param('id') id: Types.ObjectId,
		@Body() verifyPictures: VerifyPicturesDto,
	): Promise<ResponseObject<MediaResponseType[]>> {
		const data = await this.mediaService.verifyPictures(id, verifyPictures);
		return new ResponseObject('RECOGNITION_SCORES_FOUND', data);
	}
}
