import { IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { Types } from 'mongoose';

export class PaginationDto {
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@IsOptional()
	skip?: number;

	@Type(() => Number)
	@IsNumber()
	@Min(1)
	@IsOptional()
	limit?: number;

	@IsOptional()
	startId?: Types.ObjectId;
}

export class SortDirectionDto {
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(1)
	@IsOptional()
	createdAt?: number;
	@Type(() => Number)
	@IsInt()
	@Min(0)
	@Max(1)
	@IsOptional()
	updatedAt?: number;
}
