// pages/history/history.js
const { get, post } = require('../../utils/request')

Page({
  data: {
    activeTab: 'all',
    historyList: [],
    isLoggedIn: false,
    loading: false,
    hasMore: true,
    page: 1,
    pageSize: 10
  },

  onLoad() {
    console.log('history页面加载')
  },

  onShow() {
    console.log('history页面显示')
    this.checkLoginAndLoad()
  },

  // 检查登录状态并加载数据
  checkLoginAndLoad() {
    const app = getApp()
    const isLoggedIn = app.globalData.isLoggedIn

    if (!isLoggedIn) {
      // 未登录，跳转到登录页面
      wx.navigateTo({
        url: '/pages/login/login'
      })
      return
    }

    this.setData({
      isLoggedIn: true
    })
    this.loadHistoryList()
  },

  // 加载历史记录列表
  async loadHistoryList(refresh = true) {
    if (!this.data.isLoggedIn) {
      return
    }

    if (this.data.loading) {
      return
    }

    this.setData({
      loading: true
    })

    try {
      const page = refresh ? 1 : this.data.page
      const params = {
        page: page,
        limit: this.data.pageSize
      }
      
      // 只有当status不是'all'时才添加status参数
      if (this.data.activeTab !== 'all') {
        params.status = this.data.activeTab
      }
      
      const result = await get('/api/v1/user/history', params)

      if (result.success && result.data) {
        // 处理API返回的数据格式
        let apiItems = result.data.items || []
        
        // 转换数据格式，添加前端需要的字段
        const processedItems = apiItems.map(item => ({
          id: item.id,
          title: this.getItemTitle(item),
          status: this.mapStatus(item.status),
          statusText: this.getStatusText(item.status),
          thumbnail: this.getThumbnail(item),
          createTime: item.createdAt || item.createTime,
          processTime: item.processTime,
          progress: this.getProgress(item.status),
          model: 'AI智能修复',
          inputUrl: item.inputUrl,
          outputUrl: item.outputUrl,
          errorMessage: item.errorMessage
        }))
        
        const historyList = refresh ? processedItems : [...this.data.historyList, ...processedItems]
        
        this.setData({
          historyList: historyList,
          hasMore: (result.data.total || 0) > historyList.length,
          page: page,
          loading: false
        })
      } else {
        throw new Error(result.message || '获取历史记录失败')
      }
    } catch (error) {
      console.error('加载历史记录失败，使用模拟数据:', error)
      this.setData({
        loading: false
      })
      
      // 使用模拟数据进行展示
      if (refresh) {
        this.setData({
          historyList: this.getMockData(),
          hasMore: false
        })
      }
    }
  },

  // 生成标题
  getItemTitle(item) {
    if (item.title) return item.title
    return `图像修复 #${item.id}`
  },

  // 映射状态
  mapStatus(status) {
    const statusMap = {
      'completed': 'success',
      'failed': 'failed',
      'processing': 'processing',
      'pending': 'processing'
    }
    return statusMap[status] || 'processing'
  },

  // 获取状态文本
  getStatusText(status) {
    const statusTextMap = {
      'completed': '已完成',
      'failed': '处理失败',
      'processing': '处理中',
      'pending': '等待中'
    }
    return statusTextMap[status] || '未知状态'
  },

  // 获取缩略图
  getThumbnail(item) {
    // 如果有输出图片，优先使用输出图片
    if (item.outputUrl && !item.outputUrl.includes('data:image/svg')) {
      return item.outputUrl
    }
    // 否则使用输入图片
    if (item.inputUrl && !item.inputUrl.includes('data:image/svg')) {
      return item.inputUrl
    }
    // 最后使用thumbnail字段
    if (item.thumbnail && !item.thumbnail.includes('data:image/svg')) {
      return item.thumbnail
    }
    // 如果都是base64或无效，使用占位图
    const colors = ['e6f7ff/1890ff', 'fff7e6/ffa940', 'f6ffed/52c41a', 'fff1f0/ff4d4f']
    const randomColor = colors[Math.floor(Math.random() * colors.length)]
    return `https://via.placeholder.com/200x150/${randomColor}?text=图像修复`
  },

  // 获取进度
  getProgress(status) {
    switch(status) {
      case 'completed': return 100
      case 'failed': return 0
      case 'processing': return Math.floor(Math.random() * 80) + 10 // 10-90之间的随机值
      case 'pending': return 0
      default: return 0
    }
  },

  // 获取模拟数据
  getMockData() {
    return [
      {
        id: 1,
        title: '老照片修复',
        status: 'success',
        statusText: '已完成',
        thumbnail: 'https://via.placeholder.com/200x150/e6f7ff/1890ff?text=老照片修复',
        createTime: '2024-01-15 14:30',
        processTime: 1.2,
        progress: 100,
        model: 'AI智能修复',
        inputUrl: 'https://via.placeholder.com/400x300/e6f7ff/1890ff?text=原图',
        outputUrl: 'https://via.placeholder.com/400x300/e6f7ff/1890ff?text=修复后'
      },
      {
        id: 2,
        title: '水印移除',
        status: 'processing',
        statusText: '处理中',
        thumbnail: 'https://via.placeholder.com/200x150/fff7e6/ffa940?text=水印移除',
        createTime: '2024-01-15 14:25',
        processTime: null,
        progress: 65,
        model: 'AI智能修复',
        inputUrl: 'https://via.placeholder.com/400x300/fff7e6/ffa940?text=原图',
        outputUrl: null
      },
      {
        id: 3,
        title: '物体移除',
        status: 'failed',
        statusText: '处理失败',
        thumbnail: 'https://via.placeholder.com/200x150/fff1f0/ff4d4f?text=物体移除',
        createTime: '2024-01-15 14:20',
        processTime: null,
        progress: 0,
        errorMessage: '图片尺寸过大，请选择较小的图片',
        model: 'AI智能修复',
        inputUrl: 'https://via.placeholder.com/400x300/fff1f0/ff4d4f?text=原图',
        outputUrl: null
      },
      {
        id: 4,
        title: '文字清除',
        status: 'success',
        statusText: '已完成',
        thumbnail: 'https://via.placeholder.com/200x150/f6ffed/52c41a?text=文字清除',
        createTime: '2024-01-15 14:15',
        processTime: 0.8,
        progress: 100,
        model: 'AI智能修复',
        inputUrl: 'https://via.placeholder.com/400x300/f6ffed/52c41a?text=原图',
        outputUrl: 'https://via.placeholder.com/400x300/f6ffed/52c41a?text=修复后'
      }
    ]
  },

  // 切换标签
  onTabChange(e) {
    const tab = e.detail.value
    this.setData({
      activeTab: tab,
      page: 1
    })
    this.loadHistoryList(true)
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/result/result?historyId=${id}`
    })
  },

  // 重新处理
  reprocess(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.historyList.find(item => item.id === id)
    
    if (item) {
      wx.navigateTo({
        url: `/pages/editor/editor?imagePath=${encodeURIComponent(item.thumbnail)}&reprocessId=${id}`
      })
    }
  },

  // 删除记录
  async deleteItem(e) {
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条记录吗？删除后无法恢复。',
      success: async (res) => {
        if (res.confirm) {
          try {
            const result = await post('/api/v1/user/history/delete', { id })
            
            if (result.success) {
              // 从列表中移除
              const historyList = this.data.historyList.filter(item => item.id !== id)
              this.setData({
                historyList
              })
              
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
            } else {
              throw new Error(result.message || '删除失败')
            }
          } catch (error) {
            console.error('删除记录失败:', error)
            wx.showToast({
              title: '删除失败',
              icon: 'error'
            })
          }
        }
      }
    })
  },

  // 查看结果
  viewResult(e) {
    const id = e.currentTarget.dataset.id
    const item = this.data.historyList.find(item => item.id === id)
    
    if (item && item.outputUrl) {
      wx.navigateTo({
        url: `/pages/result/result?historyId=${id}&imageUrl=${encodeURIComponent(item.outputUrl)}`
      })
    } else {
      wx.showToast({
        title: '结果图片不存在',
        icon: 'error'
      })
    }
  },

  // 跳转到编辑页面
  goToEditor() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  // 下拉刷新
  onPullDownRefresh() {
    this.loadHistoryList(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  // 上拉加载更多
  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      })
      this.loadHistoryList(false)
    }
  },

  // 分享功能
  onShareAppMessage() {
    return {
      title: 'IOPaint - AI图像修复工具',
      path: '/pages/index/index',
      imageUrl: '/assets/share-image.jpg'
    }
  }
})
