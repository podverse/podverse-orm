import { validate } from 'class-validator'
import createError from 'http-errors'

export class CustomStatusError extends Error {
  public BadRequest() {
    return new createError.BadRequest(this.message)
  }
}

export class CustomValidationError extends CustomStatusError {
  constructor(error) {
    super(error)
    for (const key of Object.keys(error.constraints)) {
      this.name = key
      this.message = error.constraints[key]
      // Error.captureStackTrace(this, CustomValidationError)
      return
    }
  }
}

export const validateClassOrThrow = async (obj) => {
  const errors = await validate(obj)

  if (errors.length > 0) {
    for (const error of errors) {
      throw new CustomValidationError(error).BadRequest()
    }
  }
}

export const errorMessages = {
  accountClaimToken: {
    redeem: {
      accountClaimTokenNotFound: 'AccountClaimToken not found. If the issue persists please contact support.',
      alreadyClaimed: 'This offer has already been claimed.',
      emailNotFound:
        'Account with this email not found. Please Sign Up before claiming this offer, or contact support for help.'
    }
  }
}
