import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RequestInterceptor } from '../src/abstract/request.interceptor';
import fastifyCookie from 'fastify-cookie';
import fastifyHelmet from 'fastify-helmet';

describe('AppController (e2e)', () => {
	let app: NestFastifyApplication;

	beforeAll(async () => {
		const moduleFixture: TestingModule = await Test.createTestingModule({
			imports: [AppModule],
		}).compile();

		app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
		app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
		app.useGlobalInterceptors(new RequestInterceptor());
		await app.register(fastifyCookie, {
			secret: 'custom-cookies', // for cookies signature
		});
		app.enableCors({ origin: '*', credentials: true });

		await app.register(fastifyHelmet, {
			contentSecurityPolicy: {
				directives: {
					defaultSrc: [`'self'`],
					styleSrc: [`'self'`, `'unsafe-inline'`],
					imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
					scriptSrc: [`'self'`, `https: 'unsafe-inline'`],
				},
			},
		});
		await app.init();
	});

	afterAll(async () => {
		await app?.close();
	});

	it('/ (GET)', async () => {
		const response = await app.inject({
			method: 'GET',
			url: '/health',
		});
		expect(response.statusCode).toEqual(200);
		expect(response.body).toEqual('OK');
	});
});
