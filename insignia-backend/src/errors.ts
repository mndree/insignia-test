export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public error: string = 'HttpError',
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export class BadRequestException extends HttpError {
  constructor(message: string) {
    super(400, message, 'Bad Request');
  }
}

export class UnauthorizedException extends HttpError {
  constructor(message: string = 'Unauthorized') {
    super(401, message, 'Unauthorized');
  }
}

export class NotFoundException extends HttpError {
  constructor(message: string = 'Not Found') {
    super(404, message, 'Not Found');
  }
}

export class ConflictException extends HttpError {
  constructor(message: string = 'Conflict') {
    super(409, message, 'Conflict');
  }
}
