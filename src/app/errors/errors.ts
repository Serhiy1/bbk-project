export class HttpError extends Error {
  statuscode: number;

  constructor(status: number, message: string) {
    super(message);
    this.statuscode = status;
  }
}

export class NotFoundError extends HttpError {
  constructor(message: string) {
    super(404, message);
  }
}

export class UnAuthenticatedError extends HttpError {
  constructor(message: string) {
    super(403, message);
  }
}

export class ServerError extends HttpError {
  constructor(message: string) {
    super(500, message);
  }
}
