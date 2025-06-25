// pages/index/index.js
const { post } = require('../../utils/request')

Page({
  data: {
    bannerImage: '/assets/banner.jpg',
    recentWorks: [],
    features: [
      {
        icon: '🤖',
        title: '智能识别',
        desc: 'AI自动识别需要修复的区域'
      },
      {
        icon: '⚡',
        title: '快速修复',
        desc: '一键完成图像修复处理'
      },
      {
        icon: '🎨',
        title: '高清输出',
        desc: '保持原图质量的修复效果'
      }
    ],
    isLoggedIn: false,
    userInfo: null
  },

  onShow() {
    console.log('首页显示')
    this.loadUserInfo()
    this.loadRecentWorks()
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    const userInfo = app.globalData.userInfo
    const isLoggedIn = app.globalData.isLoggedIn

    if (isLoggedIn && userInfo) {
      console.log('用户已登录:', userInfo.nickName)
      this.setData({
        isLoggedIn: true,
        userInfo: userInfo
      })
    } else {
      console.log('用户未登录，但允许浏览')
      this.setData({
        isLoggedIn: false,
        userInfo: null
      })
    }
  },

  // 加载最近作品
  async loadRecentWorks() {
    if (!this.data.isLoggedIn) {
      // 未登录时显示示例作品
      this.setData({
        recentWorks: []
      })
      return
    }

    try {
      const result = await post('/api/v1/user/recent-works', {
        limit: 6
      })
      
      if (result.success) {
        this.setData({
          recentWorks: result.data || []
        })
      }
    } catch (error) {
      console.error('获取最近作品失败，使用模拟数据:', error)
      // 使用模拟数据
      this.setData({
        recentWorks: [
          {
            id: 1,
            thumbnail: 'https://via.placeholder.com/200x150/f0f0f0/666666?text=老照片修复',
            title: '老照片修复',
            createTime: '2024-01-15'
          },
          {
            id: 2,
            thumbnail: 'https://via.placeholder.com/200x150/f0f0f0/666666?text=水印移除',
            title: '水印移除',
            createTime: '2024-01-14'
          },
          {
            id: 3,
            thumbnail: 'https://via.placeholder.com/200x150/f0f0f0/666666?text=物体移除',
            title: '物体移除',
            createTime: '2024-01-13'
          }
        ]
      })
    }
  },

  // 开始创作 - 检查登录状态
  async startEdit() {
    if (!this.data.isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    // 已登录，选择图片
    this.selectImage()
  },

  // 选择图片
  selectImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      maxDuration: 30,
      camera: 'back',
      success: (res) => {
        if (res.tempFiles && res.tempFiles.length > 0) {
          const tempFilePath = res.tempFiles[0].tempFilePath
          
          // 跳转到编辑页面 - 修正参数名为image
          wx.navigateTo({
            url: `/pages/editor/editor?image=${encodeURIComponent(tempFilePath)}`
          })
        }
      },
      fail: (error) => {
        console.error('选择图片失败:', error)
        if (error.errMsg && !error.errMsg.includes('cancel')) {
          wx.showToast({
            title: '选择图片失败',
            icon: 'error',
            duration: 2000
          })
        }
      }
    })
  },

  // 查看作品详情
  viewWork(e) {
    const workId = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/result/result?workId=${workId}`
    })
  },

  // 查看更多作品
  viewMoreWorks() {
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

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'IOPaint - 专业的AI图像修复工具',
      path: '/pages/index/index',
      imageUrl: '/assets/share-image.jpg'
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    return {
      title: 'IOPaint - 让图像修复变得简单',
      imageUrl: '/assets/share-image.jpg'
    }
  }
})
