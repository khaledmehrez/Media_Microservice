import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { catchError, map, Observable, throwError } from 'rxjs';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';

export class RequestInterceptor implements NestInterceptor {
	private readonly logger = winston.createLogger({
		handleExceptions: true,
		transports: [
			new winston.transports.Console({
				format:
					process.env.DEBUG?.toString() == 'true'
						? winston.format.combine(
								winston.format.timestamp(),
								winston.format.ms(),
								winston.format.json(),
								nestWinstonModuleUtilities.format.nestLike('MEDIA-MS', { prettyPrint: true }),
								winston.format.align(),
								winston.format.colorize({ all: true }),
						  )
						: winston.format.combine(winston.format.timestamp(), winston.format.ms(), winston.format.json()),
			}),
		],
	});

	intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
		const request = context.switchToHttp().getRequest();
		const response = context.switchToHttp().getResponse();

		request.auth = request.user;
		request.user = undefined;
		const startTime = Date.now();
		if (process.env.DEBUG == 'true') {
			return next.handle();
		} else
			return next.handle().pipe(
				map((value) => {
					if (request.url == '/health') return value;
					const requestDuration = Date.now() - startTime;
					const message = `${request.method} ${request.url} ${response.statusCode} ${request.headers['user-agent']} ${requestDuration}ms`;
					this.logger.info(message);
					return value;
				}),
				catchError((err) => {
					this.logger.log(err.status < 500 ? 'warn' : 'error', err, {
						error: err,
						body: request.body,
						headers: request.headers,
						stack: err.stack,
						query: request.query,
						url: request.url,
						id: request.id,
						method: request.method,
						routerMethod: request.requestMethod,
						routerPath: request.routerPath,
						client: request.headers['user-agent'],
					});
					return throwError(err);
				}),
			);
	}
}
