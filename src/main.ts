import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { RequestInterceptor } from './abstract/request.interceptor';
import { ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import fastifyCookie from 'fastify-cookie';
import fastifyHelmet from 'fastify-helmet';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import fastifyMultipart from 'fastify-multipart';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import './dd-tracer';

async function bootstrap() {
	const app = await NestFactory.create<NestFastifyApplication>(AppModule, new FastifyAdapter({ logger: false }));

	app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
	app.useGlobalInterceptors(new RequestInterceptor());
	await app.register(fastifyCookie, {
		secret: 'custom-cookies',
	});
	await app.register(fastifyMultipart);
	app.enableCors({ origin: '*', credentials: true });
	app.useLogger(app.get(WINSTON_MODULE_NEST_PROVIDER));

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

	app.enableVersioning({ defaultVersion: VERSION_NEUTRAL, type: VersioningType.URI });

	const config = new DocumentBuilder()
		.setTitle('Lovester - Media MS')
		.setDescription('Lovester - Media MS API description')
		.setVersion('0.0.1')
		.addTag('Media MS')
		.build();
	const document = SwaggerModule.createDocument(app, config);
	SwaggerModule.setup('docs', app, document, {
		swaggerUrl: 'json',
	});

	await app.listen(process.env.DEFAULT_PORT || process.env.MEDIA_MS_PORT, '0.0.0.0');
}

bootstrap();
