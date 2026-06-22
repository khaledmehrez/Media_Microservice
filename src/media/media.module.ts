import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { FileManagerService } from './file-manager.service';
import { MediaControllerV0 } from './media-v0.controller';

@Module({
	controllers: [MediaControllerV0],
	providers: [MediaService, FileManagerService],
})
export class MediaModule {}
