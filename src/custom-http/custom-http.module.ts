import { Global, Module } from '@nestjs/common';
import { CustomHttpService } from './custom-http.service';
import { HttpModule } from '@nestjs/axios';
@Global()
@Module({
	imports: [HttpModule],
	providers: [CustomHttpService],
	exports: [CustomHttpService],
})
export class CustomHttpModule {}
