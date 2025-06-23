const app = getApp()

class Request {
  constructor() {
    this.baseURL = ''
    this.timeout = 10000
  }

  // 获取服务器地址
  getBaseURL() {
    return app.globalData.serverUrl
  }

  // 获取请求头
  getHeaders() {
    const headers = {
      'Content-Type': 'application/json'
    }
    
    // 添加认证token
    if (app.globalData.token) {
      headers['Authorization'] = `Bearer ${app.globalData.token}`
    }
    
    return headers
  }

  // 通用请求方法
  request(options) {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', data = {}, header = {} } = options
      
      wx.request({
        url: this.getBaseURL() + url,
        method: method,
        data: data,
        header: {
          ...this.getHeaders(),
          ...header
        },
        timeout: this.timeout,
        success: (res) => {
          console.log(`请求 ${method} ${url}:`, res)
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else if (res.statusCode === 401) {
            // Token过期，清除登录状态
            app.clearUserInfo()
            wx.showToast({
              title: '登录已过期，请重新登录',
              icon: 'none'
            })
            // 跳转到登录页
            wx.navigateTo({
              url: '/pages/login/login'
            })
            reject(new Error('认证失败'))
          } else {
            const error = new Error(res.data.message || '请求失败')
            error.statusCode = res.statusCode
            reject(error)
          }
        },
        fail: (error) => {
          console.error(`请求失败 ${method} ${url}:`, error)
          if (error.errMsg.includes('timeout')) {
            reject(new Error('请求超时，请检查网络连接'))
          } else if (error.errMsg.includes('fail')) {
            reject(new Error('网络连接失败，请检查网络设置'))
          } else {
            reject(new Error('请求失败'))
          }
        }
      })
    })
  }

  // GET请求
  get(url, data = {}) {
    // 将参数添加到URL
    const queryString = Object.keys(data)
      .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(data[key])}`)
      .join('&')
    
    const fullUrl = queryString ? `${url}?${queryString}` : url
    
    return this.request({
      url: fullUrl,
      method: 'GET'
    })
  }

  // POST请求
  post(url, data = {}) {
    return this.request({
      url: url,
      method: 'POST',
      data: data
    })
  }

  // PUT请求
  put(url, data = {}) {
    return this.request({
      url: url,
      method: 'PUT',
      data: data
    })
  }

  // DELETE请求
  delete(url, data = {}) {
    return this.request({
      url: url,
      method: 'DELETE',
      data: data
    })
  }

  // 文件上传
  uploadFile(url, filePath, name = 'file', formData = {}) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: this.getBaseURL() + url,
        filePath: filePath,
        name: name,
        formData: formData,
        header: {
          ...this.getHeaders()
        },
        success: (res) => {
          console.log(`文件上传 ${url}:`, res)
          
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data)
              resolve(data)
            } catch (error) {
              resolve(res.data)
            }
          } else {
            reject(new Error('文件上传失败'))
          }
        },
        fail: (error) => {
          console.error(`文件上传失败 ${url}:`, error)
          reject(new Error('文件上传失败'))
        }
      })
    })
  }
}

// 创建请求实例
const request = new Request()

// 导出便捷方法
module.exports = {
  get: request.get.bind(request),
  post: request.post.bind(request),
  put: request.put.bind(request),
  delete: request.delete.bind(request),
  uploadFile: request.uploadFile.bind(request),
  request: request.request.bind(request)
} 