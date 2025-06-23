// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    isLoggedIn: false,
    serverUrl: 'http://localhost:8000',
    uploadProgress: 0,
    currentProcessId: null,
    systemInfo: null
  },

  onLaunch() {
    // 获取系统信息
    this.getSystemInfo()
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 初始化网络监听
    this.initNetworkListener()
    
    console.log('IOPaint小程序启动')
  },

  onShow() {
    // 当小程序启动，或从后台进入前台显示
    console.log('小程序显示')
  },

  onHide() {
    // 当小程序从前台进入后台
    console.log('小程序隐藏')
  },

  onError(msg) {
    console.error('小程序错误:', msg)
  },

  // 获取系统信息
  getSystemInfo() {
    wx.getSystemInfo({
      success: (res) => {
        this.globalData.systemInfo = res
        console.log('系统信息:', res)
      },
      fail: (error) => {
        console.error('获取系统信息失败:', error)
      }
    })
  },

  // 检查登录状态
  checkLoginStatus() {
    const token = wx.getStorageSync('token')
    if (token) {
      this.globalData.token = token
      this.globalData.isLoggedIn = true
    }
  },

  // 验证token有效性
  validateToken() {
    wx.checkSession({
      success: () => {
        console.log('Session有效')
      },
      fail: () => {
        console.log('Session失效，需要重新登录')
        this.clearUserInfo()
      }
    })
  },

  // 设置用户信息
  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.isLoggedIn = true
    wx.setStorageSync('userInfo', userInfo)
    wx.setStorageSync('token', token)
  },

  // 清除用户信息
  clearUserInfo() {
    this.globalData.userInfo = null
    this.globalData.token = ''
    this.globalData.isLoggedIn = false
    
    // 清除本地存储
    try {
      wx.removeStorageSync('userInfo')
      wx.removeStorageSync('token')
      console.log('用户信息已清除')
    } catch (error) {
      console.error('清除用户信息失败:', error)
    }
  },

  // 初始化网络监听
  initNetworkListener() {
    // 监听网络状态变化
    wx.onNetworkStatusChange((res) => {
      if (!res.isConnected) {
        wx.showToast({
          title: '网络连接已断开',
          icon: 'none',
          duration: 2000
        })
      } else {
        console.log('网络已连接，类型:', res.networkType)
      }
    })

    // 获取当前网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log('当前网络类型:', res.networkType)
      }
    })
  },

  // 显示错误提示
  showError(message, duration = 2000) {
    wx.showToast({
      title: message || '操作失败',
      icon: 'none',
      duration: duration
    })
  },

  // 显示成功提示
  showSuccess(message, duration = 2000) {
    wx.showToast({
      title: message || '操作成功',
      icon: 'success',
      duration: duration
    })
  },

  // 显示加载提示
  showLoading(message = '加载中...') {
    wx.showLoading({
      title: message,
      mask: true
    })
  },

  // 隐藏加载提示
  hideLoading() {
    wx.hideLoading()
  }
}) 