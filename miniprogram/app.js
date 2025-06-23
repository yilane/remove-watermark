// app.js
App({
  globalData: {
    userInfo: null,
    token: '',
    isLoggedIn: false,
    serverUrl: 'http://localhost:8080', // 生产环境API地址
    uploadProgress: 0,
    currentProcessId: null,
    systemInfo: null,
    
    // 应用配置
    config: {
      maxImageSize: 10 * 1024 * 1024, // 10MB
      supportedFormats: ['jpg', 'jpeg', 'png', 'webp'],
      models: {
        'lama': { name: 'LAMA', speed: 'fast', quality: 'good' },
        'ldm': { name: 'LDM', speed: 'slow', quality: 'excellent' }
      }
    }
  },

  onLaunch() {
    console.log('IOPaint 小程序启动')
    
    // 获取系统信息
    this.getSystemInfo()
    
    // 检查登录状态
    this.checkLoginStatus()
    
    // 初始化网络监听
    this.initNetworkListener()
    
    // 检查更新
    this.checkForUpdate()
    
    // 统计应用启动
    this.trackAppLaunch()
  },

  onShow() {
    console.log('IOPaint 小程序显示')
  },

  onHide() {
    console.log('IOPaint 小程序隐藏')
  },

  onError(error) {
    console.error('IOPaint 小程序错误:', error)
    
    // 错误上报
    this.reportError(error)
  },

  // 获取系统信息
  getSystemInfo() {
    try {
      const systemInfo = wx.getSystemInfoSync()
      this.globalData.systemInfo = systemInfo
      
      console.log('系统信息:', systemInfo)
    } catch (error) {
      console.error('获取系统信息失败:', error)
    }
  },

  // 检查登录状态
  checkLoginStatus() {
    try {
      const token = wx.getStorageSync('token')
      const userInfo = wx.getStorageSync('userInfo')
      const loginTime = wx.getStorageSync('loginTime')
      
      // 检查token是否过期（7天）
      const isTokenValid = loginTime && (Date.now() - loginTime < 7 * 24 * 60 * 60 * 1000)
      
      if (token && userInfo && isTokenValid) {
        this.globalData.token = token
        this.globalData.userInfo = userInfo
        this.globalData.isLoggedIn = true
        
        console.log('用户已登录:', userInfo.nickName)
      } else {
        // 清除过期的登录信息
        this.clearUserInfo()
      }
    } catch (error) {
      console.error('检查登录状态失败:', error)
    }
  },

  // 设置用户信息
  setUserInfo(userInfo, token) {
    this.globalData.userInfo = userInfo
    this.globalData.token = token
    this.globalData.isLoggedIn = true
    
    // 持久化存储
    try {
      wx.setStorageSync('userInfo', userInfo)
      wx.setStorageSync('token', token)
      wx.setStorageSync('loginTime', Date.now())
      
      console.log('用户信息已保存:', userInfo.nickName)
    } catch (error) {
      console.error('保存用户信息失败:', error)
    }
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
      wx.removeStorageSync('loginTime')
      
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
          duration: 3000
        })
      } else {
        console.log('网络已连接:', res.networkType)
      }
    })
    
    // 获取当前网络状态
    wx.getNetworkType({
      success: (res) => {
        console.log('当前网络类型:', res.networkType)
        
        if (res.networkType === 'none') {
          wx.showModal({
            title: '网络异常',
            content: '请检查网络连接后重试',
            showCancel: false
          })
        }
      }
    })
  },

  // 检查小程序更新
  checkForUpdate() {
    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      
      updateManager.onCheckForUpdate((res) => {
        console.log('检查更新结果:', res.hasUpdate)
      })
      
      updateManager.onUpdateReady(() => {
        wx.showModal({
          title: '更新提示',
          content: '新版本已经准备好，是否重启应用？',
          showCancel: false,
          confirmText: '重启',
          success: () => {
            updateManager.applyUpdate()
          }
        })
      })
      
      updateManager.onUpdateFailed(() => {
        console.error('新版本下载失败')
      })
    }
  },

  // 统计应用启动
  trackAppLaunch() {
    try {
      const launchCount = wx.getStorageSync('launchCount') || 0
      const lastLaunchTime = wx.getStorageSync('lastLaunchTime') || 0
      const now = Date.now()
      
      // 更新启动次数
      wx.setStorageSync('launchCount', launchCount + 1)
      wx.setStorageSync('lastLaunchTime', now)
      
      // 检查是否是新用户
      const isNewUser = launchCount === 0
      
      console.log('应用启动统计:', {
        launchCount: launchCount + 1,
        isNewUser,
        daysSinceLastLaunch: Math.floor((now - lastLaunchTime) / (1000 * 60 * 60 * 24))
      })
      
      // 新用户引导
      if (isNewUser) {
        this.showNewUserGuide()
      }
    } catch (error) {
      console.error('统计应用启动失败:', error)
    }
  },

  // 新用户引导
  showNewUserGuide() {
    // 延迟显示，避免与其他弹窗冲突
    setTimeout(() => {
      wx.showModal({
        title: '欢迎使用IOPaint',
        content: 'IOPaint是一款AI图像修复工具，可以帮您去除图片中的水印、不需要的物体等。\n\n点击首页"开始创作"即可体验！',
        showCancel: false,
        confirmText: '开始体验'
      })
    }, 1500)
  },

  // 错误上报
  reportError(error) {
    try {
      const errorInfo = {
        error: error.toString(),
        stack: error.stack,
        userAgent: this.globalData.systemInfo?.system || 'unknown',
        timestamp: new Date().toISOString(),
        userId: this.globalData.userInfo?.id || 'anonymous'
      }
      
      console.log('错误信息:', errorInfo)
      
      // 这里可以添加错误上报到服务器的逻辑
      // 例如调用错误收集服务
    } catch (reportError) {
      console.error('错误上报失败:', reportError)
    }
  },

  // 获取应用实例（工具方法）
  getApp() {
    return this
  }
}) 