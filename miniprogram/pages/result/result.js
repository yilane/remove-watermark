// pages/result/result.js
const { get, post } = require('../../utils/request')

Page({
  data: {
    processInfo: {
      status: 'success',
      duration: '12.3秒',
      model: 'LAMA',
      originalImage: '',
      resultImage: '',
      dimensions: '1024 × 768',
      format: 'PNG',
      fileSize: '2.3 MB',
      processTime: '01-15 14:30'
    },
    viewMode: 'compare',
    sliderPosition: 50,
    loading: false,
    loadingText: ''
  },

  onLoad(options) {
    if (options.processId) {
      this.loadProcessResult(options.processId)
    } else if (options.historyId) {
      this.loadHistoryResult(options.historyId)
    } else if (options.workId) {
      this.loadWorkResult(options.workId)
    }
  },

  // 加载处理结果
  async loadProcessResult(processId) {
    try {
      this.setData({ 
        loading: true,
        loadingText: '加载结果中...'
      })

      const result = await get(`/api/v1/process/${processId}`)
      
      if (result.success) {
        const processInfo = this.formatProcessInfo(result.data)
        this.setData({ processInfo })
      }
    } catch (error) {
      console.error('加载处理结果失败:', error)
      wx.showModal({
        title: '加载失败',
        content: '无法加载处理结果，请稍后重试',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack()
        }
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载历史记录结果
  async loadHistoryResult(historyId) {
    try {
      this.setData({ 
        loading: true,
        loadingText: '加载历史记录...'
      })

      const result = await get(`/api/v1/history/${historyId}`)
      
      if (result.success) {
        const processInfo = this.formatProcessInfo(result.data)
        this.setData({ processInfo })
      }
    } catch (error) {
      console.error('加载历史记录失败:', error)
      wx.showModal({
        title: '加载失败',
        content: '无法加载历史记录，请稍后重试',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack()
        }
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 加载作品结果
  async loadWorkResult(workId) {
    try {
      this.setData({ 
        loading: true,
        loadingText: '加载作品...'
      })

      const result = await get(`/api/v1/works/${workId}`)
      
      if (result.success) {
        const processInfo = this.formatProcessInfo(result.data)
        this.setData({ processInfo })
      }
    } catch (error) {
      console.error('加载作品失败:', error)
      wx.showModal({
        title: '加载失败',
        content: '无法加载作品，请稍后重试',
        showCancel: false,
        confirmText: '返回',
        success: () => {
          wx.navigateBack()
        }
      })
    } finally {
      this.setData({ loading: false })
    }
  },

  // 格式化处理信息
  formatProcessInfo(data) {
    const modelMap = {
      'lama': 'LAMA',
      'ldm': 'LDM',
      'mat': 'MAT'
    }

    return {
      status: data.status,
      duration: data.duration ? `${data.duration}秒` : '未知',
      model: modelMap[data.model] || data.model,
      originalImage: data.original_image_url,
      resultImage: data.result_image_url,
      dimensions: data.dimensions || '未知',
      format: data.format || 'PNG',
      fileSize: this.formatFileSize(data.file_size),
      processTime: this.formatTime(data.created_at || data.process_time)
    }
  },

  // 格式化文件大小
  formatFileSize(bytes) {
    if (!bytes) return '未知'
    
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0
    
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }
    
    return `${size.toFixed(1)} ${units[unitIndex]}`
  },

  // 格式化时间
  formatTime(timeString) {
    if (!timeString) return '未知'
    
    const date = new Date(timeString)
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  },

  // 查看模式切换
  onViewModeChange(e) {
    this.setData({ viewMode: e.detail.value })
  },

  // 滑动开始
  onSliderStart(e) {
    this.startX = e.touches[0].clientX
    this.startPosition = this.data.sliderPosition
    this.moving = true
  },

  // 滑动移动
  onSliderMove(e) {
    if (!this.moving) return
    
    const currentX = e.touches[0].clientX
    const deltaX = currentX - this.startX
    
    // 获取容器宽度
    const query = this.createSelectorQuery()
    query.select('.comparison-slider').boundingClientRect((rect) => {
      if (rect) {
        const deltaPercent = (deltaX / rect.width) * 100
        let newPosition = this.startPosition + deltaPercent
        
        // 限制范围
        newPosition = Math.max(0, Math.min(100, newPosition))
        
        this.setData({ sliderPosition: newPosition })
      }
    }).exec()
  },

  // 滑动结束
  onSliderEnd() {
    this.moving = false
  },

  // 保存到相册
  async saveToAlbum() {
    const { resultImage } = this.data.processInfo
    
    if (!resultImage) {
      wx.showToast({
        title: '图片不存在',
        icon: 'none'
      })
      return
    }

    try {
      this.setData({ 
        loading: true,
        loadingText: '保存中...'
      })
      
      // 下载图片
      const downloadResult = await new Promise((resolve, reject) => {
        wx.downloadFile({
          url: resultImage,
          success: resolve,
          fail: reject
        })
      })

      // 保存到相册
      await new Promise((resolve, reject) => {
        wx.saveImageToPhotosAlbum({
          filePath: downloadResult.tempFilePath,
          success: resolve,
          fail: reject
        })
      })

      this.setData({ loading: false })
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      })
      
    } catch (error) {
      this.setData({ loading: false })
      console.error('保存失败:', error)
      
      if (error.errMsg && error.errMsg.includes('saveImageToPhotosAlbum:fail auth deny')) {
        wx.showModal({
          title: '需要授权',
          content: '请在设置中允许访问相册',
          showCancel: true,
          cancelText: '取消',
          confirmText: '去设置',
          success: (res) => {
            if (res.confirm) {
              wx.openSetting()
            }
          }
        })
      } else {
        wx.showToast({
          title: '保存失败',
          icon: 'none'
        })
      }
    }
  },

  // 分享结果
  shareResult() {
    const { resultImage } = this.data.processInfo
    
    if (!resultImage) {
      wx.showToast({
        title: '图片不存在',
        icon: 'none'
      })
      return
    }

    wx.showActionSheet({
      itemList: ['分享给朋友', '分享到朋友圈', '复制链接'],
      success: (res) => {
        switch (res.tapIndex) {
          case 0:
            this.shareToFriend()
            break
          case 1:
            this.shareToMoments()
            break
          case 2:
            this.copyLink()
            break
        }
      }
    })
  },

  // 分享给朋友
  shareToFriend() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareAppMessage']
    })
  },

  // 分享到朋友圈
  shareToMoments() {
    wx.showShareMenu({
      withShareTicket: true,
      menus: ['shareTimeline']
    })
  },

  // 复制链接
  copyLink() {
    const { resultImage } = this.data.processInfo
    
    wx.setClipboardData({
      data: resultImage,
      success: () => {
        wx.showToast({
          title: '链接已复制',
          icon: 'success'
        })
      }
    })
  },

  // 基于此图再次处理
  processAgain() {
    const { resultImage } = this.data.processInfo
    
    if (!resultImage) {
      wx.showToast({
        title: '图片不存在',
        icon: 'none'
      })
      return
    }

    wx.navigateTo({
      url: `/pages/editor/editor?image=${encodeURIComponent(resultImage)}`
    })
  },

  // 返回
  goBack() {
    wx.navigateBack()
  },

  // 自定义分享
  onShareAppMessage() {
    const { processInfo } = this.data
    
    return {
      title: '看看我用AI修复的图片！',
      path: `/pages/result/result?workId=${processInfo.id}`,
      imageUrl: processInfo.resultImage
    }
  },

  // 分享到朋友圈
  onShareTimeline() {
    const { processInfo } = this.data
    
    return {
      title: '用IOPaint AI修复图片，效果超赞！',
      imageUrl: processInfo.resultImage
    }
  }
})
