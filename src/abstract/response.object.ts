export class ResponseObject<T> {
	data?: T;
	message: string;

	constructor(message: string, data = undefined) {
		this.data = data;
		this.message = message;
	}
}

export class EmptyObject {}
