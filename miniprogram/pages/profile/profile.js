// pages/profile/profile.js
const { post } = require('../../utils/request')

Page({
  data: {
    userInfo: null,
    isLoggedIn: false,
    version: '1.0.0'
  },

  onLoad() {
    console.log('profile页面加载')
  },

  onShow() {
    console.log('profile页面显示')
    this.loadUserInfo()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    const isLoggedIn = app.globalData.isLoggedIn

    this.setData({
      userInfo: userInfo || {},
      isLoggedIn: isLoggedIn
    })
  },

  // 跳转到历史记录
  goToHistory() {
    if (!this.data.isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    wx.switchTab({
      url: '/pages/history/history'
    })
  },

  // 跳转到收藏
  goToFavorites() {
    if (!this.data.isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }
    
    wx.showToast({
      title: '收藏功能开发中',
      icon: 'none'
    })
  },

  // 跳转到设置
  goToSettings() {
    wx.showToast({
      title: '设置功能开发中',
      icon: 'none'
    })
  },

  // 跳转到登录页面
  goToLogin() {
    wx.navigateTo({
      url: '/pages/login/login'
    })
  },

  // 退出登录
  logout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.logout()
          
          this.setData({
            userInfo: null,
            isLoggedIn: false
          })
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
        }
      }
    })
  },

  // 自定义分享
  onShareAppMessage() {
    return {
      title: 'IOPaint - AI图像修复工具',
      path: '/pages/index/index',
      imageUrl: '/images/share-image.png'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'IOPaint - 专业的AI图像修复工具',
      imageUrl: '/images/share-image.png'
    }
  }
})
