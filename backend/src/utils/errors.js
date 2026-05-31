class AppError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
    };
  }
}

module.exports = { AppError };
