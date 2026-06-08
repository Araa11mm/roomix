// local@domain.tld — только допустимые символы, TLD минимум 2 буквы
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/

export function isValidEmail(email: string): boolean {
  if (!EMAIL_REGEX.test(email)) return false
  if (email.includes('..')) return false

  const [local, domain] = email.split('@')
  if (local.startsWith('.') || local.endsWith('.')) return false
  if (domain.startsWith('.') || domain.endsWith('.')) return false

  return true
}

export interface FormErrors {
  email?: string
  password?: string
  general?: string
}

export function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {}

  if (!email) {
    errors.email = 'Введите email'
  } else if (!isValidEmail(email)) {
    errors.email = 'Введите корректный email'
  }

  if (!password) {
    errors.password = 'Введите пароль'
  } else if (/[а-яёА-ЯЁ]/.test(password)) {
    errors.password = 'Пароль должен содержать только латиницу и цифры'
  } else if (password.length < 6) {
    errors.password = 'Пароль слишком короткий'
  }

  return errors
}
