import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { JwtStrategy } from './guards/jwt.strategy';
import { MediaModule } from './media/media.module';
import { BullModule } from '@nestjs/bull';
import { MongoDriverModule } from './mongo-driver/mongo-driver.module';
import { CustomHttpModule } from './custom-http/custom-http.module';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities, WinstonModule } from 'nest-winston';
import { validateEnv } from './env.validation';

@Module({
	imports: [
		ConfigModule.forRoot({ validate: validateEnv, isGlobal: true }),
		WinstonModule.forRoot({
			handleExceptions: true,
			transports: [
				new winston.transports.Console({
					format:
						process.env.DEBUG?.toString() === 'true'
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
		}),
		BullModule.forRoot({
			redis: {
				host: process.env.BULL_REDIS_HOST,
				port: parseInt(process.env.BULL_REDIS_PORT),
				password: process.env.BULL_REDIS_PASSWORD,
				sentinels: [
					{
						host: process.env.BULL_SENTINEL_HOST,
						port: parseInt(process.env.BULL_SENTINEL_PORT),
					},
				],
				sentinelPassword: process.env.BULL_SENTINEL_PASSWORD,
				name: process.env.BULL_SENTINEL_NAME,
			},
		}),
		PassportModule,
		JwtModule.register({
			secret: process.env.JWT_ACCESS_TOKEN_SECRET,
			signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
		}),
		MongoDriverModule,
		CustomHttpModule,
		MediaModule,
	],
	controllers: [AppController],
	providers: [AppService, JwtStrategy],
})
export class AppModule {}
