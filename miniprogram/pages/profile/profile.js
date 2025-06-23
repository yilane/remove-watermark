// pages/profile/profile.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    repairCount: 0
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadUserInfo()
    this.loadUserStats()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    this.loadUserInfo()
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: 'IOPaint - AI智能图像修复',
      path: '/pages/index/index'
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

  // 加载用户统计信息
  loadUserStats() {
    // 模拟数据
    this.setData({
      repairCount: 12
    })
  },

  // 前往设置页面
  goToSettings() {
    wx.showToast({
      title: '功能开发中',
      icon: 'none'
    })
  },

  // 关于我们
  goToAbout() {
    wx.showModal({
      title: '关于IOPaint',
      content: 'IOPaint是一款基于AI技术的智能图像修复工具，帮助用户轻松移除图片中不需要的内容。',
      showCancel: false
    })
  },

  // 显示隐私政策
  showPrivacy() {
    wx.showModal({
      title: '隐私政策',
      content: '我们严格保护您的个人信息安全，仅用于提供更好的服务体验。',
      showCancel: false
    })
  },

  // 显示用户协议
  showTerms() {
    wx.showModal({
      title: '用户协议',
      content: '使用本服务即表示您同意遵守我们的用户协议和服务条款。',
      showCancel: false
    })
  },

  // 退出登录
  handleLogout() {
    wx.showModal({
      title: '确认退出',
      content: '确定要退出登录吗？',
      success: (res) => {
        if (res.confirm) {
          const app = getApp()
          app.clearUserInfo()
          
          wx.showToast({
            title: '已退出登录',
            icon: 'success'
          })
          
          setTimeout(() => {
            wx.redirectTo({
              url: '/pages/login/login'
            })
          }, 1500)
        }
      }
    })
  }
})