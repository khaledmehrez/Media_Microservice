import { ExtractJwt, Strategy } from 'passport-jwt';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Types } from 'mongoose';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor() {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			signOptions: { expiresIn: process.env.JWT_ACCESS_TOKEN_EXPIRATION_TIME },
			secretOrKey: process.env.JWT_ACCESS_TOKEN_SECRET,
		});
	}

	async validate(payload: any) {
		if (payload.exp > Date.now()) {
			throw new UnauthorizedException();
		} else {
			delete payload.exp;
			delete payload.iat;
			if (payload.user) {
				payload.user = new Types.ObjectId(payload.user);
			}
			if (payload.pending) {
				payload.pending = new Types.ObjectId(payload.pending);
			}
			if (payload._id) {
				payload._id = new Types.ObjectId(payload._id);
			}

			return payload;
		}
	}
}
