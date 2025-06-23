// pages/history/history.js
Page({
  data: {
    historyList: [],
    statusOptions: ['全部状态', '处理成功', '处理中', '处理失败'],
    statusIndex: 0,
    selectedDate: ''
  },

  onLoad() {
    this.loadHistory()
  },

  onShow() {
    this.loadHistory()
  },

  // 加载历史记录
  loadHistory() {
    // 模拟数据
    const mockData = [
      {
        id: 1,
        title: '风景照修复',
        thumbnail: 'https://picsum.photos/300/300?random=1',
        status: 'success',
        statusText: '处理成功',
        mode: '高质量模式',
        createTime: '2024-01-20 15:30'
      },
      {
        id: 2,
        title: '人像照片处理',
        thumbnail: 'https://picsum.photos/300/300?random=2',
        status: 'success',
        statusText: '处理成功',
        mode: '快速模式',
        createTime: '2024-01-19 10:18'
      },
      {
        id: 3,
        title: '物体移除处理',
        thumbnail: 'https://picsum.photos/300/300?random=3',
        status: 'processing',
        statusText: '处理中',
        mode: '标准模式',
        createTime: '2024-01-22 09:15'
      }
    ]
    
    this.setData({
      historyList: mockData
    })
  },

  // 状态筛选
  onStatusChange(e) {
    this.setData({
      statusIndex: e.detail.value
    })
    this.filterHistory()
  },

  // 日期筛选
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    })
    this.filterHistory()
  },

  // 过滤历史记录
  filterHistory() {
    // 根据筛选条件过滤数据
    this.loadHistory()
  },

  // 查看详情
  viewDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/result/result?id=${id}`
    })
  },

  // 删除记录
  deleteItem(e) {
    e.stopPropagation()
    const id = e.currentTarget.dataset.id
    
    wx.showModal({
      title: '确认删除',
      content: '删除后无法恢复，确定要删除这条记录吗？',
      success: (res) => {
        if (res.confirm) {
          this.performDelete(id)
        }
      }
    })
  },

  // 执行删除
  performDelete(id) {
    const historyList = this.data.historyList.filter(item => item.id !== id)
    this.setData({ historyList })
    
    wx.showToast({
      title: '删除成功',
      icon: 'success'
    })
  },

  // 开始新的修复
  startNew() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})