import { Global, Module } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';
import { MongoDriverService } from './mongo-driver.service';

@Global()
@Module({
	providers: [
		{
			provide: 'DATABASE_CONNECTION',
			useFactory: async (): Promise<Db> => {
				try {
					const client = await MongoClient.connect(process.env.MONGO_SERVER_URL, {
						maxPoolSize: 100,
					});
					return client.db('lovester');
				} catch (e) {
					throw e;
				}
			},
		},
		MongoDriverService,
	],
	exports: ['DATABASE_CONNECTION', MongoDriverService],
})
export class MongoDriverModule {}
