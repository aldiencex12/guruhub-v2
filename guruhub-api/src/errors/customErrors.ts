export class CustomError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class BadRequestError extends CustomError {
  constructor(message: string = "Request tidak valid") {
    super(400, message);
  }
}

export class UnauthorizedError extends CustomError {
  constructor(message: string = "Tidak terautorisasi") {
    super(401, message);
  }
}

export class ForbiddenError extends CustomError {
  constructor(message: string = "Akses ditolak") {
    super(403, message);
  }
}

export class NotFoundError extends CustomError {
  constructor(message: string = "Sumber daya tidak ditemukan") {
    super(404, message);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string = "Konflik data terdeteksi") {
    super(409, message);
  }
}

export class InternalServerError extends CustomError {
  constructor(message: string = "Kesalahan internal server") {
    super(500, message);
  }
}
