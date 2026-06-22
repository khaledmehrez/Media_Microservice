import { Inject, Injectable, InternalServerErrorException } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { AxiosResponse } from 'axios';

@Injectable()
export class CustomHttpService {
	constructor(private httpService: HttpService, @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger) {}

	async post(urlMs: string, endpoint: string, data?: any | null, throwError = true): Promise<any> {
		const url = urlMs + endpoint;
		let res;
		try {
			res = await lastValueFrom(this.httpService.post(url, data));
		} catch (e) {
			this.logger.log('error', {
				log: `REQUEST_FAILED Source: POST ${url} \n\twith RESPONSE - status code: ${e.response?.status} \n\terror message: ${e.response?.data.message}`,
				message: e.message,
				stack: e.stack,
				error: e,
			});
			if (throwError)
				throw new InternalServerErrorException(
					`REQUEST_FAILED Source: POST ${url} with RESPONSE: { status code: ${e.response?.status} - error message: ${e.response?.data.message} }`,
				);
			else {
				return;
			}
		}
		return res.data;
	}

	async get(urlMs: string, endpoint: string, query?: null | any, throwError = true): Promise<AxiosResponse> {
		const url = urlMs + endpoint;
		let res;
		try {
			res = await lastValueFrom(this.httpService.get(url, query));
		} catch (e) {
			this.logger.log('error', {
				log: `REQUEST_FAILED Source: POST ${url} \n\twith RESPONSE - status code: ${e.response?.status} \n\terror message: ${e.response?.data.message}`,
				message: e.message,
				stack: e.stack,
				error: e,
			});
			if (throwError)
				throw new InternalServerErrorException(
					`REQUEST_FAILED Source: POST ${url} with RESPONSE: { status code: ${e.response?.status} - error message: ${e.response?.data.message} }`,
				);
			else {
				return;
			}
		}
		return res;
	}
}
