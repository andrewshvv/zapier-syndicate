class ParserUserError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'ParserUserError';
        Error.captureStackTrace(this, this.constructor);
    }
}

class ParserInternalError extends Error {
    constructor(message) {
        super(message);
        this.message = message;
        this.name = 'ParserInternalError';
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = {ParserUserError, ParserInternalError};