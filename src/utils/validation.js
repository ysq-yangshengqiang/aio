/**
 * 验证工具函数
 */

/**
 * 验证邮箱格式
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * 验证手机号格式
 */
export const isValidPhone = (phone) => {
  const phoneRegex = /^1[3-9]\d{9}$/
  return phoneRegex.test(phone)
}

/**
 * 验证密码强度
 */
export const validatePassword = (password) => {
  const result = {
    isValid: false,
    score: 0,
    errors: []
  }

  if (!password) {
    result.errors.push('密码不能为空')
    return result
  }

  if (password.length < 8) {
    result.errors.push('密码长度至少8位')
  } else {
    result.score += 1
  }

  if (!/[a-z]/.test(password)) {
    result.errors.push('密码必须包含小写字母')
  } else {
    result.score += 1
  }

  if (!/[A-Z]/.test(password)) {
    result.errors.push('密码必须包含大写字母')
  } else {
    result.score += 1
  }

  if (!/\d/.test(password)) {
    result.errors.push('密码必须包含数字')
  } else {
    result.score += 1
  }

  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    result.errors.push('密码必须包含特殊字符')
  } else {
    result.score += 1
  }

  result.isValid = result.errors.length === 0
  return result
}

/**
 * 验证身份证号
 */
export const isValidIdCard = (idCard) => {
  if (!idCard || idCard.length !== 18) return false

  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2]
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2']

  let sum = 0
  for (let i = 0; i < 17; i++) {
    sum += parseInt(idCard[i]) * weights[i]
  }

  const checkCode = checkCodes[sum % 11]
  return checkCode === idCard[17].toUpperCase()
}

/**
 * 验证URL格式
 */
export const isValidUrl = (url) => {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * 验证IP地址
 */
export const isValidIP = (ip) => {
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
  return ipRegex.test(ip)
}

/**
 * 验证数字范围
 */
export const isInRange = (value, min, max) => {
  const num = parseFloat(value)
  return !isNaN(num) && num >= min && num <= max
}

/**
 * 验证字符串长度
 */
export const isValidLength = (str, min = 0, max = Infinity) => {
  if (typeof str !== 'string') return false
  return str.length >= min && str.length <= max
}

/**
 * 验证必填字段
 */
export const isRequired = (value) => {
  if (value === null || value === undefined) return false
  if (typeof value === 'string') return value.trim().length > 0
  if (Array.isArray(value)) return value.length > 0
  return true
}

/**
 * 验证数组
 */
export const isValidArray = (arr, minLength = 0, maxLength = Infinity) => {
  return Array.isArray(arr) && arr.length >= minLength && arr.length <= maxLength
}

/**
 * 验证对象
 */
export const isValidObject = (obj, requiredKeys = []) => {
  if (!obj || typeof obj !== 'object') return false
  
  return requiredKeys.every(key => obj.hasOwnProperty(key))
}

/**
 * 验证日期格式
 */
export const isValidDate = (dateString) => {
  const date = new Date(dateString)
  return date instanceof Date && !isNaN(date)
}

/**
 * 验证年龄
 */
export const isValidAge = (birthDate, minAge = 0, maxAge = 150) => {
  if (!isValidDate(birthDate)) return false
  
  const today = new Date()
  const birth = new Date(birthDate)
  const age = today.getFullYear() - birth.getFullYear()
  
  return age >= minAge && age <= maxAge
}

/**
 * 验证文件类型
 */
export const isValidFileType = (file, allowedTypes = []) => {
  if (!file || !file.type) return false
  return allowedTypes.includes(file.type)
}

/**
 * 验证文件大小
 */
export const isValidFileSize = (file, maxSize) => {
  if (!file || !file.size) return false
  return file.size <= maxSize
}

/**
 * 验证银行卡号
 */
export const isValidBankCard = (cardNumber) => {
  if (!cardNumber) return false
  
  const cleaned = cardNumber.replace(/\s/g, '')
  if (!/^\d{16,19}$/.test(cleaned)) return false
  
  // Luhn算法验证
  let sum = 0
  let isEven = false
  
  for (let i = cleaned.length - 1; i >= 0; i--) {
    let digit = parseInt(cleaned[i])
    
    if (isEven) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    
    sum += digit
    isEven = !isEven
  }
  
  return sum % 10 === 0
}

/**
 * 验证中文姓名
 */
export const isValidChineseName = (name) => {
  const chineseNameRegex = /^[\u4e00-\u9fa5]{2,4}$/
  return chineseNameRegex.test(name)
}

/**
 * 验证英文姓名
 */
export const isValidEnglishName = (name) => {
  const englishNameRegex = /^[a-zA-Z\s]{2,50}$/
  return englishNameRegex.test(name)
}

/**
 * 验证用户名
 */
export const isValidUsername = (username) => {
  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/
  return usernameRegex.test(username)
}

/**
 * 验证颜色值
 */
export const isValidColor = (color) => {
  const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/
  const rgbRegex = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/
  const rgbaRegex = /^rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*(0|1|0?\.\d+)\s*\)$/
  
  return hexRegex.test(color) || rgbRegex.test(color) || rgbaRegex.test(color)
}

/**
 * 表单验证器
 */
export class FormValidator {
  constructor() {
    this.rules = {}
    this.errors = {}
  }

  /**
   * 添加验证规则
   */
  addRule(field, rule) {
    if (!this.rules[field]) {
      this.rules[field] = []
    }
    this.rules[field].push(rule)
    return this
  }

  /**
   * 验证单个字段
   */
  validateField(field, value) {
    const fieldRules = this.rules[field] || []
    const fieldErrors = []

    for (const rule of fieldRules) {
      const result = rule.validator(value)
      if (!result) {
        fieldErrors.push(rule.message)
      }
    }

    if (fieldErrors.length > 0) {
      this.errors[field] = fieldErrors
    } else {
      delete this.errors[field]
    }

    return fieldErrors.length === 0
  }

  /**
   * 验证所有字段
   */
  validate(data) {
    this.errors = {}
    let isValid = true

    Object.keys(this.rules).forEach(field => {
      const fieldValid = this.validateField(field, data[field])
      if (!fieldValid) {
        isValid = false
      }
    })

    return {
      isValid,
      errors: this.errors
    }
  }

  /**
   * 获取字段错误
   */
  getFieldErrors(field) {
    return this.errors[field] || []
  }

  /**
   * 获取所有错误
   */
  getAllErrors() {
    return this.errors
  }

  /**
   * 清除错误
   */
  clearErrors(field = null) {
    if (field) {
      delete this.errors[field]
    } else {
      this.errors = {}
    }
  }

  /**
   * 重置验证器
   */
  reset() {
    this.rules = {}
    this.errors = {}
  }
}

/**
 * 常用验证规则
 */
export const ValidationRules = {
  required: (message = '此字段为必填项') => ({
    validator: isRequired,
    message
  }),

  email: (message = '请输入有效的邮箱地址') => ({
    validator: isValidEmail,
    message
  }),

  phone: (message = '请输入有效的手机号码') => ({
    validator: isValidPhone,
    message
  }),

  minLength: (min, message = `最少需要${min}个字符`) => ({
    validator: (value) => isValidLength(value, min),
    message
  }),

  maxLength: (max, message = `最多允许${max}个字符`) => ({
    validator: (value) => isValidLength(value, 0, max),
    message
  }),

  range: (min, max, message = `值必须在${min}到${max}之间`) => ({
    validator: (value) => isInRange(value, min, max),
    message
  }),

  pattern: (regex, message = '格式不正确') => ({
    validator: (value) => regex.test(value),
    message
  }),

  custom: (validator, message = '验证失败') => ({
    validator,
    message
  })
}