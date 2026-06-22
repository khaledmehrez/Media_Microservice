import { plainToClass } from 'class-transformer';
import { IsDefined, IsOptional, ValidateIf, validateSync } from 'class-validator';

class EnvironmentVariables {
	@IsDefined()
	MONGO_URL;

	@IsDefined()
	MONGO_SERVER_URL;

	@IsDefined()
	JWT_ACCESS_TOKEN_SECRET;

	@IsDefined()
	JWT_ACCESS_TOKEN_EXPIRATION_TIME;

	@IsDefined()
	ORIGIN;

	@IsDefined()
	USER_MS_URL;

	@IsDefined()
	AUTH_MS_URL;

	@IsDefined()
	PERSONALITY_MS_URL;

	@IsDefined()
	MATCH_MS_URL;

	@IsDefined()
	CHAT_MS_URL;

	@IsDefined()
	NOTIFICATION_MS_URL;

	@IsDefined()
	MEDIA_MS_URL;

	@IsDefined()
	SUGGESTIONS_MS_URL;

	@IsDefined()
	PAYMENT_MS_URL;

	@IsDefined()
	BILLING_MS_URL;

	@IsDefined()
	@ValidateIf((object) => object.MEDIA_MS_PORT === undefined)
	DEFAULT_PORT;

	@IsDefined()
	@ValidateIf((object) => object.DEFAULT_PORT === undefined)
	MEDIA_MS_PORT;

	@IsDefined()
	ACCESS_KEY;

	@IsDefined()
	SECRET;

	@IsDefined()
	REGION;

	@IsDefined()
	BUCKET;

	@IsDefined()
	LOCAL_FOLDER;

	@IsDefined()
	PICTURE_URL;

	@IsDefined()
	ENDPOINT_SAVE_PICTURE_USER;

	@IsDefined()
	ENDPOINT_SAVE_PICTURE_PENDING;

	@IsDefined()
	ENDPOINT_SAVE_BLURRY_PICTURE_USER;

	@IsDefined()
	ENDPOINT_USER_UPDATE_IS_SAFE;

	@IsDefined()
	ENDPOINT_USER_CREATE_ID_VERIFICATION;

	@IsDefined()
	ENDPOINT_USER_UPDATE_ID_VERIFICATION_STATUS;

	@IsDefined()
	ENDPOINT_CHAT_SEND_PICTURE;

	@IsDefined()
	BULL_REDIS_HOST;

	@IsDefined()
	BULL_REDIS_PORT;

	@IsDefined()
	@IsOptional()
	BULL_REDIS_PASSWORD;

	@IsDefined()
	BULL_SENTINEL_HOST;

	@IsDefined()
	BULL_SENTINEL_PORT;

	@IsDefined()
	@IsOptional()
	BULL_SENTINEL_PASSWORD;

	@IsDefined()
	BULL_SENTINEL_NAME;
}

export function validateEnv(config: Record<string, unknown>) {
	const validatedConfig = plainToClass(EnvironmentVariables, config, { enableImplicitConversion: true });
	const errors = validateSync(validatedConfig, { skipNullProperties: false, skipMissingProperties: false });

	if (errors.length > 0) {
		throw new Error(errors.toString());
	}
	return validatedConfig;
}
