const { post } = require('../../utils/request')

Page({
  data: {
    isLogging: false
  },

  onLoad() {
    // 检查是否已登录
    const app = getApp()
    if (app.globalData.isLoggedIn) {
      this.redirectToMain()
    }
  },

  onShow() {
    // 页面显示时重置登录状态
    this.setData({
      isLogging: false
    })
  },

  // 微信登录处理
  async handleWechatLogin() {
    if (this.data.isLogging) return
    
    try {
      this.setData({ isLogging: true })
      
      // 1. 获取登录凭证
      const loginRes = await this.getWechatCode()
      if (!loginRes.code) {
        throw new Error('获取登录凭证失败')
      }

      // 2. 模拟登录成功（因为后端服务未启动）
      console.log('微信登录凭证获取成功，模拟登录流程')
      
      // 模拟用户信息
      const mockUserInfo = {
        nickName: '微信用户',
        avatarUrl: '',
        gender: 0,
        country: '',
        province: '',
        city: ''
      }

      // 模拟服务器响应
      const mockResponse = {
        success: true,
        data: {
          user: mockUserInfo,
          access_token: 'mock_token_' + Date.now()
        }
      }

      // 保存用户信息和Token
      const app = getApp()
      app.setUserInfo(mockResponse.data.user, mockResponse.data.access_token)

      // 登录成功提示
      wx.showToast({
        title: '登录成功',
        icon: 'success',
        duration: 1500
      })

      // 延时跳转到首页
      setTimeout(() => {
        this.redirectToMain()
      }, 1500)

    } catch (error) {
      console.error('登录失败:', error)
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setData({ isLogging: false })
    }
  },

  // 获取微信登录凭证
  getWechatCode() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            console.log('获取登录凭证成功:', res.code)
            resolve({ code: res.code })
          } else {
            console.error('获取登录凭证失败:', res)
            reject(new Error('获取用户登录态失败'))
          }
        },
        fail: (error) => {
          console.error('微信登录失败:', error)
          reject(new Error('微信登录失败'))
        }
      })
    })
  },

  // 获取用户信息
  getUserProfile() {
    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善用户资料',
        success: (res) => {
          console.log('获取用户信息成功:', res.userInfo)
          resolve(res.userInfo)
        },
        fail: (error) => {
          console.log('获取用户信息失败:', error)
          reject(error)
        }
      })
    })
  },

  // 跳转到主页
  redirectToMain() {
    wx.switchTab({
      url: '/pages/index/index',
      fail: (error) => {
        console.error('跳转首页失败:', error)
        // 如果switchTab失败，尝试使用redirectTo
        wx.redirectTo({
          url: '/pages/index/index'
        })
      }
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们将严格保护您的个人信息安全，仅用于提供更好的服务体验。详细内容请查看完整版隐私政策。',
      showCancel: true,
      confirmText: '我知道了',
      cancelText: '查看详情',
      success: (res) => {
        if (!res.confirm) {
          // 用户点击查看详情，可以跳转到详细页面
          wx.navigateTo({
            url: '/pages/webview/webview?url=privacy&title=隐私政策'
          })
        }
      }
    })
  },

  // 显示用户协议
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '使用本服务即表示您同意遵守我们的用户协议，包括服务条款和使用规范。',
      showCancel: true,
      confirmText: '我知道了',
      cancelText: '查看详情',
      success: (res) => {
        if (!res.confirm) {
          // 用户点击查看详情
          wx.navigateTo({
            url: '/pages/webview/webview?url=terms&title=用户协议'
          })
        }
      }
    })
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'IOPaint - AI智能图像修复',
      path: '/pages/login/login',
      imageUrl: '/images/share-image.jpg'
    }
  }
}) 