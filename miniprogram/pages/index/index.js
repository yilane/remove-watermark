// pages/index/index.js
Page({
  data: {
    userInfo: {},
    hasUnreadNotifications: false,
    recentHistory: []
  },

  onLoad() {
    this.checkLoginStatus()
    this.loadUserInfo()
  },

  onShow() {
    this.loadUserInfo()
    this.loadRecentHistory()
  },

  // 检查登录状态
  checkLoginStatus() {
    const app = getApp()
    if (!app.globalData.isLoggedIn) {
      wx.redirectTo({
        url: '/pages/login/login'
      })
    }
  },

  // 加载用户信息
  loadUserInfo() {
    const app = getApp()
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo
      })
    }
  },

  // 加载最近历史记录
  loadRecentHistory() {
    // 使用模拟数据（无需后端服务）
    console.log('加载历史记录（模拟数据）')
    this.setData({
      recentHistory: [
        {
          id: 1,
          title: '风景照修复',
          thumbnail: 'https://picsum.photos/300/300?random=1',
          status: 'success',
          statusText: '处理成功',
          createTime: '1小时前'
        },
        {
          id: 2,
          title: '人像照片处理', 
          thumbnail: 'https://picsum.photos/300/300?random=2',
          status: 'success',
          statusText: '处理成功',
          createTime: '昨天'
        }
      ]
    })
  },

  // 开始编辑
  startEditing() {
    wx.navigateTo({
      url: '/pages/editor/editor'
    })
  },

  // 快捷移除物体
  quickRemoveObject() {
    wx.navigateTo({
      url: '/pages/editor/editor?mode=remove-object'
    })
  },

  // 快捷移除人物
  quickRemovePerson() {
    wx.navigateTo({
      url: '/pages/editor/editor?mode=remove-person'
    })
  },

  // 快捷移除文字
  quickRemoveText() {
    wx.navigateTo({
      url: '/pages/editor/editor?mode=remove-text'
    })
  },

  // 快捷图像增强
  quickEnhance() {
    wx.navigateTo({
      url: '/pages/editor/editor?mode=enhance'
    })
  },

  // 查看所有历史记录
  viewAllHistory() {
    wx.switchTab({
      url: '/pages/history/history'
    })
  },

  // 查看历史记录详情
  viewHistoryDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    })
  },

  // 重新编辑
  reEdit(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/editor/editor?historyId=${id}`
    })
  },

  // 查看结果
  viewResult(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    })
  },

  // 显示通知
  showNotifications() {
    wx.showToast({
      title: '暂无新通知',
      icon: 'none'
    })
  },

  // 获取状态文本
  getStatusText(status) {
    const statusMap = {
      'pending': '处理中',
      'processing': '处理中',
      'success': '处理成功',
      'failed': '处理失败'
    }
    return statusMap[status] || '未知状态'
  },

  // 格式化时间
  formatTime(timestamp) {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now - date
    
    if (diff < 60000) {
      return '刚刚'
    } else if (diff < 3600000) {
      return `${Math.floor(diff / 60000)}分钟前`
    } else if (diff < 86400000) {
      return `${Math.floor(diff / 3600000)}小时前`
    } else {
      return `${date.getMonth() + 1}-${date.getDate()} ${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`
    }
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadRecentHistory()
    wx.stopPullDownRefresh()
  },

  // 页面分享
  onShareAppMessage() {
    return {
      title: 'IOPaint - AI智能图像修复',
      path: '/pages/index/index'
    }
  }
}) 