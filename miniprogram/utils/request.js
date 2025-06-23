/**
 * 网络请求工具模块
 * 统一封装HTTP请求和文件上传功能
 */

class Request {
  constructor() {
    this.baseURL = ''
    this.timeout = 30000 // 30秒超时
    this.retryCount = 3 // 重试次数
  }

  // 初始化配置
  init() {
    const app = getApp()
    this.baseURL = app.globalData.serverUrl
  }

  /**
   * 通用请求方法
   * @param {Object} options 请求选项
   * @returns {Promise} 请求结果
   */
  request(options) {
    // 确保初始化
    if (!this.baseURL) {
      this.init()
    }

    return new Promise((resolve, reject) => {
      this._makeRequest(options, resolve, reject)
    })
  }

  // 执行请求
  _makeRequest(options, resolve, reject, retryCount = 0) {
    const app = getApp()
    
    // 构建完整URL
    const url = this._buildURL(options.url)
    
    // 构建请求头
    const header = this._buildHeaders(options.header)
    
    wx.request({
      url,
      method: options.method || 'GET',
      data: options.data,
      header,
      timeout: this.timeout,
      success: (res) => {
        this._handleResponse(res, resolve, reject, options, retryCount)
      },
      fail: (error) => {
        this._handleError(error, options, resolve, reject, retryCount)
      }
    })
  }

  // 构建完整URL
  _buildURL(path) {
    if (path.startsWith('http')) {
      return path
    }
    return this.baseURL + (path.startsWith('/') ? path : '/' + path)
  }

  // 构建请求头
  _buildHeaders(customHeaders = {}) {
    const app = getApp()
    
    const headers = {
      'Content-Type': 'application/json',
      ...customHeaders
    }

    // 添加认证头
    if (app.globalData.token) {
      headers.Authorization = `Bearer ${app.globalData.token}`
    }

    // 添加设备信息
    if (app.globalData.systemInfo) {
      headers['X-Device-Info'] = JSON.stringify({
        platform: app.globalData.systemInfo.platform,
        version: app.globalData.systemInfo.version,
        model: app.globalData.systemInfo.model
      })
    }

    return headers
  }

  // 处理响应
  _handleResponse(res, resolve, reject, options, retryCount) {
    const { statusCode, data } = res
    
    if (statusCode === 200) {
      // 成功响应
      if (data && typeof data === 'object') {
        if (data.success !== false) {
          resolve(data)
        } else {
          reject(new Error(data.message || '请求失败'))
        }
      } else {
        resolve(data)
      }
    } else if (statusCode === 401) {
      // Token过期，清除用户信息
      this._handleUnauthorized()
      reject(new Error('登录已过期，请重新登录'))
    } else if (statusCode === 429) {
      // 请求频率限制
      reject(new Error('请求过于频繁，请稍后重试'))
    } else if (statusCode >= 500 && retryCount < this.retryCount) {
      // 服务器错误，重试
      console.log(`服务器错误，第${retryCount + 1}次重试`)
      setTimeout(() => {
        this._makeRequest(options, resolve, reject, retryCount + 1)
      }, Math.pow(2, retryCount) * 1000) // 指数退避
    } else {
      reject(new Error(data?.message || `请求失败 (${statusCode})`))
    }
  }

  // 处理请求错误
  _handleError(error, options, resolve, reject, retryCount) {
    console.error('请求错误:', error)
    
    // 网络错误重试
    if (retryCount < this.retryCount && this._isRetryableError(error)) {
      console.log(`网络错误，第${retryCount + 1}次重试`)
      setTimeout(() => {
        this._makeRequest(options, resolve, reject, retryCount + 1)
      }, Math.pow(2, retryCount) * 1000)
    } else {
      const message = this._getErrorMessage(error)
      reject(new Error(message))
    }
  }

  // 判断是否可重试的错误
  _isRetryableError(error) {
    const retryableErrors = ['timeout', 'fail', 'network error']
    return retryableErrors.some(err => 
      error.errMsg && error.errMsg.toLowerCase().includes(err)
    )
  }

  // 获取错误消息
  _getErrorMessage(error) {
    if (error.errMsg) {
      if (error.errMsg.includes('timeout')) {
        return '请求超时，请检查网络连接'
      } else if (error.errMsg.includes('fail')) {
        return '网络连接失败，请检查网络设置'
      }
    }
    return '网络请求失败，请稍后重试'
  }

  // 处理未授权
  _handleUnauthorized() {
    const app = getApp()
    app.clearUserInfo()
    
    // 延迟显示登录提示，避免重复弹窗
    setTimeout(() => {
      wx.showModal({
        title: '登录过期',
        content: '登录状态已过期，请重新登录',
        showCancel: false,
        confirmText: '重新登录',
        success: () => {
          wx.switchTab({
            url: '/pages/profile/profile'
          })
        }
      })
    }, 100)
  }

  /**
   * 序列化查询参数
   * @param {Object} params 参数对象
   * @returns {string} 序列化后的查询字符串
   */
  _serializeParams(params) {
    if (!params || typeof params !== 'object') {
      return ''
    }
    
    const pairs = []
    for (const key in params) {
      if (params.hasOwnProperty(key) && params[key] !== undefined && params[key] !== null) {
        const value = params[key]
        pairs.push(encodeURIComponent(key) + '=' + encodeURIComponent(value))
      }
    }
    return pairs.join('&')
  }

  /**
   * GET请求
   * @param {string} url 请求地址
   * @param {Object} data 请求参数
   * @param {Object} options 额外选项
   * @returns {Promise} 请求结果
   */
  get(url, data, options = {}) {
    // 将参数添加到URL中
    if (data && Object.keys(data).length > 0) {
      const params = this._serializeParams(data)
      if (params) {
        url += (url.includes('?') ? '&' : '?') + params
      }
    }
    
    return this.request({
      url,
      method: 'GET',
      ...options
    })
  }

  /**
   * POST请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise} 请求结果
   */
  post(url, data, options = {}) {
    return this.request({
      url,
      method: 'POST',
      data,
      ...options
    })
  }

  /**
   * PUT请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise} 请求结果
   */
  put(url, data, options = {}) {
    return this.request({
      url,
      method: 'PUT',
      data,
      ...options
    })
  }

  /**
   * DELETE请求
   * @param {string} url 请求地址
   * @param {Object} data 请求数据
   * @param {Object} options 额外选项
   * @returns {Promise} 请求结果
   */
  delete(url, data, options = {}) {
    return this.request({
      url,
      method: 'DELETE',
      data,
      ...options
    })
  }

  /**
   * 文件上传
   * @param {string} filePath 本地文件路径
   * @param {Object} formData 额外的表单数据
   * @param {Object} options 额外选项
   * @returns {Promise} 上传结果
   */
  uploadFile(filePath, formData = {}, options = {}) {
    return new Promise((resolve, reject) => {
      const app = getApp()
      
      const uploadTask = wx.uploadFile({
        url: this._buildURL(options.url || '/api/v1/upload'),
        filePath,
        name: options.name || 'file',
        formData,
        header: this._buildHeaders(options.header),
        timeout: options.timeout || 60000, // 上传超时60秒
        success: (res) => {
          try {
            if (res.statusCode === 200) {
              const data = JSON.parse(res.data)
              resolve(data)
            } else {
              reject(new Error(`上传失败 (${res.statusCode})`))
            }
          } catch (error) {
            reject(new Error('上传响应解析失败'))
          }
        },
        fail: (error) => {
          const message = this._getErrorMessage(error)
          reject(new Error(message))
        }
      })

      // 监听上传进度
      if (options.onProgress) {
        uploadTask.onProgressUpdate(options.onProgress)
      } else {
        // 默认更新全局进度
        uploadTask.onProgressUpdate((res) => {
          app.globalData.uploadProgress = res.progress
        })
      }
    })
  }

  /**
   * 下载文件
   * @param {string} url 文件地址
   * @param {Object} options 下载选项
   * @returns {Promise} 下载结果
   */
  downloadFile(url, options = {}) {
    return new Promise((resolve, reject) => {
      wx.downloadFile({
        url: this._buildURL(url),
        header: this._buildHeaders(options.header),
        timeout: options.timeout || 60000,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res)
          } else {
            reject(new Error(`下载失败 (${res.statusCode})`))
          }
        },
        fail: (error) => {
          const message = this._getErrorMessage(error)
          reject(new Error(message))
        }
      })
    })
  }
}

// 创建实例
const request = new Request()

// 导出方法
module.exports = {
  request: request.request.bind(request),
  get: request.get.bind(request),
  post: request.post.bind(request),
  put: request.put.bind(request),
  delete: request.delete.bind(request),
  uploadFile: request.uploadFile.bind(request),
  downloadFile: request.downloadFile.bind(request)
} 