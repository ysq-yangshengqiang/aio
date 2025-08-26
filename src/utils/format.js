/**
 * 格式化工具函数
 */

/**
 * 格式化数字
 */
export const formatNumber = (num, options = {}) => {
  const {
    decimals = 0,
    thousandsSeparator = ',',
    decimalSeparator = '.',
    prefix = '',
    suffix = ''
  } = options

  if (isNaN(num)) return '0'

  const number = parseFloat(num)
  const parts = number.toFixed(decimals).split('.')
  
  // 添加千位分隔符
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousandsSeparator)
  
  const formatted = parts.join(decimalSeparator)
  return `${prefix}${formatted}${suffix}`
}

/**
 * 格式化百分比
 */
export const formatPercentage = (value, decimals = 1) => {
  return formatNumber(value, { decimals, suffix: '%' })
}

/**
 * 格式化文件大小
 */
export const formatFileSize = (bytes, decimals = 2) => {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`
}

/**
 * 格式化货币
 */
export const formatCurrency = (amount, currency = 'CNY', locale = 'zh-CN') => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * 截断文本
 */
export const truncateText = (text, maxLength = 100, suffix = '...') => {
  if (!text || text.length <= maxLength) return text
  return text.substring(0, maxLength - suffix.length) + suffix
}

/**
 * 首字母大写
 */
export const capitalize = (str) => {
  if (!str) return ''
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase()
}

/**
 * 驼峰命名转换
 */
export const camelCase = (str) => {
  return str.replace(/[-_\s]+(.)?/g, (_, c) => c ? c.toUpperCase() : '')
}

/**
 * 短横线命名转换
 */
export const kebabCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

/**
 * 下划线命名转换
 */
export const snakeCase = (str) => {
  return str.replace(/([a-z])([A-Z])/g, '$1_$2').toLowerCase()
}

/**
 * 格式化手机号
 */
export const formatPhone = (phone) => {
  if (!phone) return ''
  const cleaned = phone.replace(/\D/g, '')
  const match = cleaned.match(/^(\d{3})(\d{4})(\d{4})$/)
  if (match) {
    return `${match[1]} ${match[2]} ${match[3]}`
  }
  return phone
}

/**
 * 格式化身份证号
 */
export const formatIdCard = (idCard) => {
  if (!idCard) return ''
  const cleaned = idCard.replace(/\s/g, '')
  if (cleaned.length === 18) {
    return `${cleaned.substring(0, 6)} ${cleaned.substring(6, 14)} ${cleaned.substring(14)}`
  }
  return idCard
}

/**
 * 格式化银行卡号
 */
export const formatBankCard = (cardNumber) => {
  if (!cardNumber) return ''
  const cleaned = cardNumber.replace(/\s/g, '')
  return cleaned.replace(/(.{4})/g, '$1 ').trim()
}

/**
 * 脱敏处理
 */
export const maskString = (str, start = 3, end = 4, mask = '*') => {
  if (!str || str.length <= start + end) return str
  
  const startStr = str.substring(0, start)
  const endStr = str.substring(str.length - end)
  const maskStr = mask.repeat(str.length - start - end)
  
  return startStr + maskStr + endStr
}

/**
 * 脱敏手机号
 */
export const maskPhone = (phone) => {
  return maskString(phone, 3, 4)
}

/**
 * 脱敏邮箱
 */
export const maskEmail = (email) => {
  if (!email || !email.includes('@')) return email
  
  const [username, domain] = email.split('@')
  const maskedUsername = maskString(username, 1, 1)
  
  return `${maskedUsername}@${domain}`
}

/**
 * 脱敏身份证
 */
export const maskIdCard = (idCard) => {
  return maskString(idCard, 6, 4)
}

/**
 * 格式化JSON
 */
export const formatJSON = (obj, indent = 2) => {
  try {
    return JSON.stringify(obj, null, indent)
  } catch (error) {
    return String(obj)
  }
}

/**
 * 解析JSON
 */
export const parseJSON = (str, defaultValue = null) => {
  try {
    return JSON.parse(str)
  } catch (error) {
    return defaultValue
  }
}

/**
 * 格式化URL参数
 */
export const formatUrlParams = (params) => {
  const searchParams = new URLSearchParams()
  
  Object.keys(params).forEach(key => {
    const value = params[key]
    if (value !== null && value !== undefined && value !== '') {
      searchParams.append(key, String(value))
    }
  })
  
  return searchParams.toString()
}

/**
 * 解析URL参数
 */
export const parseUrlParams = (search = window.location.search) => {
  const params = {}
  const searchParams = new URLSearchParams(search)
  
  for (const [key, value] of searchParams) {
    params[key] = value
  }
  
  return params
}

/**
 * 格式化颜色值
 */
export const formatColor = (color) => {
  if (!color) return '#000000'
  
  // 如果是十六进制颜色
  if (color.startsWith('#')) {
    return color.length === 4 
      ? color.replace(/([^#])/g, '$1$1') // #abc -> #aabbcc
      : color
  }
  
  // 如果是RGB颜色
  if (color.startsWith('rgb')) {
    const match = color.match(/\d+/g)
    if (match && match.length >= 3) {
      const [r, g, b] = match.map(n => parseInt(n).toString(16).padStart(2, '0'))
      return `#${r}${g}${b}`
    }
  }
  
  return color
}

/**
 * 生成随机颜色
 */
export const generateRandomColor = () => {
  return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
}

/**
 * 颜色亮度计算
 */
export const getColorBrightness = (color) => {
  const hex = formatColor(color).replace('#', '')
  const r = parseInt(hex.substr(0, 2), 16)
  const g = parseInt(hex.substr(2, 2), 16)
  const b = parseInt(hex.substr(4, 2), 16)
  
  return (r * 299 + g * 587 + b * 114) / 1000
}

/**
 * 判断颜色是否为深色
 */
export const isDarkColor = (color) => {
  return getColorBrightness(color) < 128
}

/**
 * 获取对比色
 */
export const getContrastColor = (color) => {
  return isDarkColor(color) ? '#ffffff' : '#000000'
}