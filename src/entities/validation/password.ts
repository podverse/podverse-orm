import { ValidatorConstraint, ValidatorConstraintInterface } from 'class-validator'
import { validatePassword } from '../../lib/validation'

@ValidatorConstraint({ name: '', async: false })
export class ValidatePassword implements ValidatorConstraintInterface {
  validate(text: string) {
    const result = validatePassword(text)
    return result === true
  }

  defaultMessage() {
    return 'Invalid password. Password must be at least 8 character, with at least 1 uppercase letter, 1 lowercase letter, and 1 number.'
  }
}
