import { applyDecorators } from '@nestjs/common';
import { ApiResponse, getSchemaPath } from '@nestjs/swagger';
import { ReferenceObject, SchemaObject } from '@nestjs/swagger/dist/interfaces/open-api-spec.interface';

export const CustomApiCreatedResponse = (
	title: string,
	messages: string | string[],
	// eslint-disable-next-line @typescript-eslint/ban-types
	dataType?: string | Function,
	isArray = false,
) => CustomApiResponse(title, messages, 201, isArray, dataType);

export const CustomApiOkResponse = (
	title: string,
	messages: string | string[],
	// eslint-disable-next-line @typescript-eslint/ban-types
	dataType?: string | Function,
	isArray = false,
) => CustomApiResponse(title, messages, 200, isArray, dataType);

// eslint-disable-next-line @typescript-eslint/ban-types
export const CustomApiBadRequestResponse = (title: string, messages: string | string[]) =>
	ApiResponse({
		status: 400,
		schema: {
			title: title,
			oneOf: [
				{
					properties: {
						message: { example: messages },
						statusCode: { example: 400 },
						error: { example: 'Bad Request' },
					},
				},
			],
		},
	});

export const CustomApiNotFoundResponse = (title: string, messages: string | string[]) =>
	ApiResponse({
		status: 404,
		schema: {
			title: title,
			oneOf: [
				{
					properties: {
						message: { example: messages },
						statusCode: { example: 404 },
						error: { example: 'Not FOUND' },
					},
				},
			],
		},
	});

export const CustomApiUnauthorizedResponse = (title: string) =>
	applyDecorators(
		ApiResponse({
			status: 401,
			schema: {
				title: title,
				oneOf: [
					{
						properties: {
							message: { example: 'Unauthorized' },
							statusCode: { example: 401 },
						},
					},
				],
			},
		}),
	);

// eslint-disable-next-line @typescript-eslint/ban-types
export const CustomApiResponse = (
	title: string,
	messages: string | string[],
	status: number,

	isArray: boolean,
	// eslint-disable-next-line @typescript-eslint/ban-types
	dataType?: string | Function,
) => {
	const properties: Record<string, SchemaObject | ReferenceObject> = {};

	if (typeof messages === 'string') {
		properties.message = {
			title: 'Message',
			description: 'message indicating what occurred',
			example: messages,
		};
	} else {
		properties.message = {
			title: 'Message',
			description: 'message indicating what occurred',
			oneOf: messages.map((msg) => {
				return {
					example: msg,
				};
			}),
			examples: messages,
		};
	}
	if (dataType) {
		properties.data = isArray
			? { items: { $ref: getSchemaPath(dataType) }, type: 'array' }
			: { $ref: getSchemaPath(dataType) };
	}

	return applyDecorators(
		ApiResponse({
			status: status,
			schema: {
				title: title,
				anyOf: [
					{
						properties,
					},
				],
			},
		}),
	);
};
