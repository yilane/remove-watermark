// pages/editor/editor.js
const { post, uploadFile } = require('../../utils/request')
const { getImageInfo, validateImageFormat, validateImageSize, compressImage } = require('../../utils/image')

Page({
  data: {
    originalImage: '',
    currentTool: 'brush',
    brushSize: 10,
    selectedModel: 'fast',
    showMask: true,
    processing: false,
    showProgressDialog: false,
    processProgress: 0,
    processStatus: '准备中...',
    statusBarHeight: 44,
    headerHeight: 0,
    
    // 画布相关
    canvasWidth: 0,
    canvasHeight: 0,
    drawing: false,
    lastPoint: null,
    strokes: [], // 存储所有笔画，用于撤销
    showUploadArea: true,
    imageInfo: null,
    
    // 图片变换相关
    scale: 1,
    scalePercent: 100,
    translateX: 0,
    translateY: 0,
    imageWidth: 0,
    imageHeight: 0,
    
    // 触摸相关
    touchStartTime: 0,
    lastTouchDistance: 0,
    lastTouchCenter: null,
    moving: false,
    
    // 页面状态
    pageReady: false
  },

  // 错误处理方法
  handleError(error, context = '未知操作') {
    console.error(`${context}发生错误:`, error)
    
    // 如果是网络错误或系统错误，显示用户友好的提示
    const userFriendlyMessage = this.getUserFriendlyErrorMessage(error)
    
    if (userFriendlyMessage) {
      wx.showToast({
        title: userFriendlyMessage,
        icon: 'none',
        duration: 2000
      })
    }
  },

  // 获取用户友好的错误信息
  getUserFriendlyErrorMessage(error) {
    if (!error) return null
    
    const errorMessage = error.message || error.errMsg || String(error)
    
    if (errorMessage.includes('network')) {
      return '网络连接失败，请检查网络'
    } else if (errorMessage.includes('timeout')) {
      return '操作超时，请重试'
    } else if (errorMessage.includes('canvas')) {
      return '画布初始化失败，请重新进入'
    } else if (errorMessage.includes('image')) {
      return '图片处理失败，请重新选择'
    }
    
    return null // 系统内部错误不显示给用户
  },

  onLoad(options) {
    console.log('编辑页面接收参数:', options)
    
    // 延迟初始化，避免过早调用API
    setTimeout(() => {
      this.initPage(options)
    }, 100)
  },

  // 初始化页面
  initPage(options) {
    // 检查是否有图片参数
    if (options.image) {
      const imagePath = decodeURIComponent(options.image)
      console.log('接收到图片路径:', imagePath)
      
      // 验证图片路径
      this.validateAndSetImage(imagePath)
    } else {
      console.log('未接收到图片参数，显示上传界面')
      this.setData({
        showUploadArea: true
      })
    }
    
    // 获取系统信息，计算安全区域
    try {
      const systemInfo = wx.getSystemInfoSync()
      console.log('系统信息:', systemInfo)
      
      // 获取状态栏高度（px）
      const statusBarHeight = systemInfo.statusBarHeight || 44
      
      // 计算头部总高度 (状态栏 + 导航栏44px)
      const headerHeight = statusBarHeight + 44
      
      this.setData({
        statusBarHeight: statusBarHeight,
        headerHeight: headerHeight
      })
      
      // 初始化画布
      this.initCanvas()
    } catch (error) {
      console.error('获取系统信息失败:', error)
      // 使用默认值
      this.setData({
        statusBarHeight: 44,
        headerHeight: 88
      })
    }
  },

  onReady() {
    // 标记页面已准备好
    this.setData({ pageReady: true })
    
    // 确保页面完全加载后再设置画布
    setTimeout(() => {
      console.log('页面Ready，开始设置画布')
      if (this.data.imageWidth > 0 && this.data.imageHeight > 0) {
        this.setupCanvas()
      }
    }, 300)
  },

  // 初始化画布
  initCanvas() {
    // 获取系统信息
    const systemInfo = wx.getSystemInfoSync()
    const canvasSize = Math.min(systemInfo.windowWidth - 48, 600) // 减去padding
    
    this.setData({
      canvasWidth: canvasSize,
      canvasHeight: canvasSize
    })
  },

  // 设置画布
  async setupCanvas() {
    // 检查画布尺寸是否有效
    if (!this.data.imageWidth || !this.data.imageHeight) {
      console.log('画布尺寸无效，跳过设置')
      return
    }

    try {
      const query = this.createSelectorQuery()
      
      console.log('开始设置画布，图片逻辑尺寸:', this.data.imageWidth, 'x', this.data.imageHeight)
      
      // 获取图片元素的实际显示尺寸
      query.select('.original-image')
        .boundingClientRect((imageRect) => {
          if (!imageRect) {
            console.error('无法获取图片显示尺寸')
            return
          }
          
          console.log('图片实际显示尺寸:', imageRect.width, 'x', imageRect.height)
          
          // 使用图片的实际显示尺寸设置画布
          const actualWidth = imageRect.width
          const actualHeight = imageRect.height
          
          // 设置绘制画布
          const drawQuery = this.createSelectorQuery()
          drawQuery.select('#drawCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              if (res && res[0] && res[0].node) {
                const canvas = res[0].node
                const ctx = canvas.getContext('2d')
                
                // 设置画布内部分辨率与图片实际显示尺寸一致
                canvas.width = actualWidth
                canvas.height = actualHeight
                
                // 设置画笔样式
                ctx.lineCap = 'round'
                ctx.lineJoin = 'round'
                ctx.globalCompositeOperation = 'source-over'
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
                ctx.lineWidth = this.data.brushSize
                
                // 调试：画一个边框来确认画布位置
                ctx.strokeStyle = 'rgba(0, 255, 0, 0.5)'
                ctx.lineWidth = 2
                ctx.strokeRect(0, 0, actualWidth, actualHeight)
                
                // 恢复画笔样式
                ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
                ctx.lineWidth = this.data.brushSize
                
                this.drawCanvas = canvas
                this.drawCtx = ctx
                
                // 保存画布实际尺寸
                this.canvasLogicalWidth = actualWidth
                this.canvasLogicalHeight = actualHeight
                
                console.log('绘制画布设置完成:', {
                  canvasInternalSize: { width: canvas.width, height: canvas.height },
                  canvasActualSize: { width: actualWidth, height: actualHeight }
                })
              } else {
                console.error('获取绘制画布失败')
              }
            })
          
          // 设置蒙版画布
          const maskQuery = this.createSelectorQuery()
          maskQuery.select('#maskCanvas')
            .fields({ node: true, size: true })
            .exec((res) => {
              if (res && res[0] && res[0].node) {
                const canvas = res[0].node
                const ctx = canvas.getContext('2d')
                
                // 设置画布内部分辨率与图片实际显示尺寸一致
                canvas.width = actualWidth
                canvas.height = actualHeight
                
                this.maskCanvas = canvas
                this.maskCtx = ctx
                
                console.log('蒙版画布设置完成:', {
                  canvasInternalSize: { width: canvas.width, height: canvas.height },
                  canvasActualSize: { width: actualWidth, height: actualHeight }
                })
              } else {
                console.error('获取蒙版画布失败')
              }
            })
        })
        .exec()
        
    } catch (error) {
      console.error('设置画布时出错:', error)
    }
  },

  // 图片加载完成
  onImageLoad(e) {
    console.log('图片加载完成:', e.detail)
    
    // 延迟设置画布，确保图片完全渲染
    setTimeout(() => {
      if (this.data.imageWidth > 0 && this.data.imageHeight > 0) {
        this.setupCanvas()
      }
    }, 200)
  },

  // 触摸开始
  onTouchStart(e) {
    if (!e.touches || e.touches.length === 0) return
    
    const touches = e.touches
    this.setData({ touchStartTime: Date.now() })

    if (touches.length === 1) {
      // 单指触摸
      if (this.data.currentTool === 'move') {
        // 移动模式
        this.setData({
          moving: true,
          lastTouchCenter: {
            x: touches[0].clientX,
            y: touches[0].clientY
          }
        })
      } else if (this.data.currentTool === 'brush') {
        // 绘制模式
        if (!this.drawCtx) return
        
        this.setData({ drawing: true })
        const touch = touches[0]
        
        // 在笔画开始时，查询一次rect并缓存
        const query = this.createSelectorQuery()
        query.select('.canvas-container')
          .boundingClientRect((containerRect) => {
            if (!containerRect) {
              console.error('无法获取容器位置')
              return
            }
            this.currentStrokeRect = containerRect // 缓存容器rect
            
            const point = this.getTouchPoint(touch, this.currentStrokeRect)
            this.setData({ lastPoint: point })
            
            this.updateBrushStyle()
            
            this.drawCtx.beginPath()
            this.drawCtx.moveTo(point.x, point.y)
            
            this.currentStroke = [point]
          })
          .exec()
      }
    } else if (touches.length === 2) {
      // 双指缩放
      const distance = this.getDistance(touches[0], touches[1])
      const center = this.getCenter(touches[0], touches[1])
      
      this.setData({
        lastTouchDistance: distance,
        lastTouchCenter: center
      })
    }
  },

  // 触摸移动
  onTouchMove(e) {
    if (!e.touches || e.touches.length === 0) return
    
    const touches = e.touches

    if (touches.length === 1 && this.data.currentTool === 'move' && this.data.moving) {
      // 单指移动
      const touch = touches[0]
      const deltaX = touch.clientX - this.data.lastTouchCenter.x
      const deltaY = touch.clientY - this.data.lastTouchCenter.y
      
      this.setData({
        translateX: this.data.translateX + deltaX,
        translateY: this.data.translateY + deltaY,
        lastTouchCenter: {
          x: touch.clientX,
          y: touch.clientY
        }
      })
    } else if (touches.length === 2) {
      // 双指缩放
      const distance = this.getDistance(touches[0], touches[1])
      
      if (this.data.lastTouchDistance > 0) {
        const scale = distance / this.data.lastTouchDistance
        const newScale = Math.min(Math.max(this.data.scale * scale, 0.5), 3)
        this.setData({ 
          scale: newScale,
          scalePercent: Math.round(newScale * 100)
        })
      }
      this.setData({ lastTouchDistance: distance })
    } else if (this.data.currentTool === 'brush' && this.data.drawing && touches.length === 1) {
      // 绘制模式
      if (!this.drawCtx || !this.currentStrokeRect) return // 使用缓存的rect
      
      const touch = touches[0]
      const point = this.getTouchPoint(touch, this.currentStrokeRect) // 传入缓存的rect
      
      this.drawCtx.lineTo(point.x, point.y)
      this.drawCtx.stroke()
      
      this.setData({ lastPoint: point })
      
      if (this.currentStroke) {
        this.currentStroke.push(point)
      }
    }
  },

  // 触摸结束
  onTouchEnd() {
    this.setData({
      moving: false,
      lastTouchDistance: 0,
      lastTouchCenter: null
    })

    // 如果是绘制模式，保存笔画
    if (this.data.drawing) {
      this.setData({ drawing: false })
      this.currentStrokeRect = null // 清除缓存的rect
      
      // 保存笔画用于撤销，使用原始画笔大小
      if (this.currentStroke && this.currentStroke.length > 0) {
        const strokes = [...this.data.strokes, {
          points: this.currentStroke,
          tool: this.data.currentTool,
          size: this.data.brushSize
        }]
        this.setData({ strokes })
      }
      
      this.currentStroke = null
      
      // 更新蒙版
      this.updateMask()
    }
  },

  // 获取触摸点相对画布的坐标
  getTouchPoint(touch, canvasRect) {
    // 触摸点相对于页面的位置
    const touchX = touch.pageX
    const touchY = touch.pageY
    
    // 触摸点相对于画布容器的位置
    const containerX = touchX - canvasRect.left
    const containerY = touchY - canvasRect.top
    
    // 获取当前的变换参数
    const { scale, translateX, translateY } = this.data
    
    // 计算容器中心点
    const containerCenterX = canvasRect.width / 2
    const containerCenterY = canvasRect.height / 2
    
    // 触摸点相对于容器中心的偏移
    const offsetFromCenterX = containerX - containerCenterX
    const offsetFromCenterY = containerY - containerCenterY
    
    // 逆向应用变换：撤销平移和缩放
    const unTranslatedX = offsetFromCenterX - translateX
    const unTranslatedY = offsetFromCenterY - translateY
    const unScaledX = unTranslatedX / scale
    const unScaledY = unTranslatedY / scale
    
    // 获取画布逻辑尺寸
    const canvasLogicalWidth = this.canvasLogicalWidth || this.data.imageWidth
    const canvasLogicalHeight = this.canvasLogicalHeight || this.data.imageHeight
    
    // 映射到画布坐标系（画布中心对应容器中心）
    const canvasX = unScaledX + canvasLogicalWidth / 2
    const canvasY = unScaledY + canvasLogicalHeight / 2
    
    // 确保坐标在画布范围内
    const x = Math.max(0, Math.min(canvasX, canvasLogicalWidth))
    const y = Math.max(0, Math.min(canvasY, canvasLogicalHeight))
    
    console.log(`触摸(${touchX},${touchY}) → 画布(${x.toFixed(1)},${y.toFixed(1)}) 缩放${scale}`)
    
    return { x, y }
  },

  // 更新画笔样式
  updateBrushStyle() {
    if (!this.drawCtx) return
    
    const { currentTool, brushSize } = this.data
    
    // 使用原始画笔大小，不根据缩放调整
    this.drawCtx.lineWidth = brushSize
    
    if (currentTool === 'brush') {
      this.drawCtx.globalCompositeOperation = 'source-over'
      this.drawCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
    } else if (currentTool === 'eraser') {
      this.drawCtx.globalCompositeOperation = 'destination-out'
    }
    
    // console.log('画笔样式更新:', {
    //   size: brushSize,
    //   tool: currentTool
    // })
  },

  // 更新蒙版
  updateMask() {
    if (!this.maskCtx || !this.drawCanvas) return
    
    // 清除蒙版
    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height)
    
    // 复制绘制内容到蒙版
    this.maskCtx.drawImage(this.drawCanvas, 0, 0)
  },

  // 选择工具
  selectTool(e) {
    const tool = e.currentTarget.dataset.tool
    this.setData({ currentTool: tool })
    
    if (tool === 'smart') {
      this.smartSelect()
    }
  },

  // 智能选择
  smartSelect() {
    wx.showToast({
      title: '智能选择功能开发中',
      icon: 'none'
    })
  },

  // 撤销最后一笔
  undoLastStroke() {
    const strokes = this.data.strokes
    if (strokes.length === 0) return
    
    // 移除最后一笔
    const newStrokes = strokes.slice(0, -1)
    this.setData({ strokes: newStrokes })
    
    // 重新绘制
    this.redrawCanvas()
  },

  // 清除画布
  clearCanvas() {
    if (!this.drawCtx || !this.maskCtx) return
    
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height)
    this.maskCtx.clearRect(0, 0, this.maskCanvas.width, this.maskCanvas.height)
    
    this.setData({ strokes: [] })
  },

  // 重新绘制画布
  redrawCanvas() {
    if (!this.drawCtx) return
    
    // 清除画布
    this.drawCtx.clearRect(0, 0, this.drawCanvas.width, this.drawCanvas.height)
    
    // 重新绘制所有笔画
    this.data.strokes.forEach(stroke => {
      if (stroke.points.length < 2) return
      
      // 设置笔画样式，使用原始保存的大小
      this.drawCtx.lineWidth = stroke.size
      
      if (stroke.tool === 'brush') {
        this.drawCtx.globalCompositeOperation = 'source-over'
        this.drawCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
      } else if (stroke.tool === 'eraser') {
        this.drawCtx.globalCompositeOperation = 'destination-out'
      }
      
      // 绘制路径
      this.drawCtx.beginPath()
      this.drawCtx.moveTo(stroke.points[0].x, stroke.points[0].y)
      
      for (let i = 1; i < stroke.points.length; i++) {
        this.drawCtx.lineTo(stroke.points[i].x, stroke.points[i].y)
      }
      
      this.drawCtx.stroke()
    })
    
    // 更新蒙版
    this.updateMask()
  },

  // 画笔大小改变
  onBrushSizeChange(e) {
    this.setData({ brushSize: e.detail.value })
  },

  // 选择模型
  selectModel(e) {
    const model = e.currentTarget.dataset.model
    this.setData({ selectedModel: model })
  },

  // 预览结果
  previewResult() {
    if (this.data.strokes.length === 0) {
      wx.showToast({
        title: '请先绘制蒙版区域',
        icon: 'none'
      })
      return
    }
    
    // 显示/隐藏蒙版
    this.setData({ showMask: !this.data.showMask })
  },

  // 开始处理
  async startProcessing() {
    if (this.data.strokes.length === 0) {
      wx.showToast({
        title: '请先绘制需要修复的区域',
        icon: 'none'
      })
      return
    }
    
    try {
      this.setData({ 
        processing: true,
        showProgressDialog: true,
        processProgress: 0,
        processStatus: '上传图片中...'
      })
      
      // 1. 上传原始图片
      const imageUploadResult = await uploadFile(this.data.originalImage, {
        type: 'original'
      })
      
      this.setData({ 
        processProgress: 30,
        processStatus: '生成蒙版中...'
      })
      
      // 2. 生成蒙版图片
      const maskImageData = await this.generateMaskImage()
      
      this.setData({ 
        processProgress: 50,
        processStatus: '上传蒙版中...'
      })
      
      // 3. 上传蒙版
      const maskUploadResult = await this.uploadMask(maskImageData)
      
      this.setData({ 
        processProgress: 70,
        processStatus: 'AI处理中...'
      })
      
      // 4. 开始AI处理
      const processResult = await post('/api/v1/inpaint', {
        image_id: imageUploadResult.data.id,
        mask_id: maskUploadResult.data.id,
        model: this.data.selectedModel === 'fast' ? 'lama' : 'ldm'
      })
      
      this.setData({ 
        processProgress: 100,
        processStatus: '处理完成！'
      })
      
      // 延迟一下再跳转，让用户看到完成状态
      setTimeout(() => {
        this.setData({ showProgressDialog: false })
        
        // 跳转到结果页面
        wx.navigateTo({
          url: `/pages/result/result?processId=${processResult.data.process_id}`
        })
      }, 1000)
      
    } catch (error) {
      console.error('处理失败:', error)
      
      this.setData({ 
        processing: false,
        showProgressDialog: false
      })
      
      wx.showModal({
        title: '处理失败',
        content: error.message || '图像处理失败，请稍后重试',
        showCancel: false
      })
    }
  },

  // 生成蒙版图片
  generateMaskImage() {
    return new Promise((resolve) => {
      if (!this.maskCanvas) {
        resolve(null)
        return
      }
      
      // 将画布转换为临时文件
      wx.canvasToTempFilePath({
        canvas: this.maskCanvas,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: () => {
          resolve(null)
        }
      })
    })
  },

  // 上传蒙版
  async uploadMask(maskImageData) {
    if (!maskImageData) {
      throw new Error('蒙版生成失败')
    }
    
    return await uploadFile(maskImageData, {
      type: 'mask'
    })
  },

  // 保存作品
  saveWork() {
    // 保存当前编辑状态
    const editData = {
      originalImage: this.data.originalImage,
      strokes: this.data.strokes,
      selectedModel: this.data.selectedModel
    }
    
    wx.setStorageSync('draft_work', editData)
    
    wx.showToast({
      title: '已保存草稿',
      icon: 'success'
    })
  },

  // 返回
  goBack() {
    if (this.data.strokes.length > 0) {
      wx.showModal({
        title: '提示',
        content: '是否要保存当前编辑？',
        showCancel: true,
        cancelText: '不保存',
        confirmText: '保存',
        success: (res) => {
          if (res.confirm) {
            this.saveWork()
          }
          wx.navigateBack()
        }
      })
    } else {
      wx.navigateBack()
    }
  },

  // 验证并设置图片
  async validateAndSetImage(imagePath) {
    try {
      // 验证图片格式
      if (!validateImageFormat(imagePath)) {
        throw new Error('不支持的图片格式')
      }

      // 验证图片大小
      const sizeValid = await validateImageSize(imagePath, 10 * 1024 * 1024) // 10MB
      if (!sizeValid) {
        throw new Error('图片大小不能超过10MB')
      }

      // 获取图片信息
      const imageInfo = await getImageInfo(imagePath)
      console.log('原始图片信息:', imageInfo)
      
      // 计算图片在contain模式下的显示尺寸
      const displaySize = this.calculateDisplaySize(imageInfo)
      console.log('计算后的显示尺寸:', displaySize)
      
      // 设置所有相关数据，确保三个元素尺寸统一
      this.setData({
        originalImage: imagePath,
        imageInfo: imageInfo,
        showUploadArea: false,
        imageWidth: displaySize.width,
        imageHeight: displaySize.height,
        canvasWidth: displaySize.width,
        canvasHeight: displaySize.height,
        scale: 1,
        scalePercent: 100,
        translateX: 0,
        translateY: 0
      })

      // 重新初始化画布
      this.initCanvasSize(displaySize)
      
    } catch (error) {
      console.error('图片验证失败:', error)
      wx.showToast({
        title: error.message || '图片加载失败',
        icon: 'error'
      })
      
      this.setData({
        showUploadArea: true
      })
    }
  },

  // 计算显示尺寸
  calculateDisplaySize(imageInfo) {
    try {
      if (!imageInfo || !imageInfo.width || !imageInfo.height) {
        console.error('图片信息无效')
        return { width: 300, height: 300 } // 默认尺寸
      }

      const systemInfo = wx.getSystemInfoSync()
      const containerWidth = Math.max(systemInfo.windowWidth - 48, 200) // 减去padding，最小200
      
      // 更新容器高度计算，考虑新的导航栏(200rpx)和底部工具栏(260rpx)
      const topSpace = 200 // 导航栏高度 (rpx转px)
      const bottomSpace = 260 // 底部工具栏和模型选择区域
      const containerHeight = Math.max(systemInfo.windowHeight - topSpace - bottomSpace, 200)
      
      // 计算缩放比例，使图片完整显示（contain模式）
      const scaleX = containerWidth / imageInfo.width
      const scaleY = containerHeight / imageInfo.height
      const scale = Math.min(scaleX, scaleY) // 取较小的缩放比例，确保完整显示
      
      const width = Math.floor(imageInfo.width * scale)
      const height = Math.floor(imageInfo.height * scale)
      
      console.log('计算显示尺寸:', { 
        width, height, scale, 
        containerWidth, containerHeight,
        originalSize: { width: imageInfo.width, height: imageInfo.height }
      })
      
      return { width, height }
    } catch (error) {
      console.error('计算显示尺寸失败:', error)
      return { width: 300, height: 300 } // 默认尺寸
    }
  },

  // 初始化画布尺寸
  initCanvasSize(displaySize) {
    if (!displaySize) return
    
    this.setData({
      canvasWidth: displaySize.width,
      canvasHeight: displaySize.height
    })
    
    console.log('画布尺寸:', displaySize)
    
    // 延迟重新设置画布，确保DOM更新完成
    setTimeout(() => {
      this.setupCanvas()
    }, 100)
  },

  // 获取图片信息 (保留原有方法作为备用)
  getImageInfo(src) {
    return getImageInfo(src)
  },

  // 选择图片
  async selectImage() {
    try {
      const res = await this.chooseMedia()
      if (res.tempFiles && res.tempFiles.length > 0) {
        let tempFilePath = res.tempFiles[0].tempFilePath
        
        // 显示压缩提示
        wx.showLoading({
          title: '处理图片中...'
        })
        
        try {
          // 压缩图片
          const compressedPath = await compressImage(tempFilePath, {
            maxWidth: 1920,
            maxHeight: 1920,
            quality: 0.8
          })
          
          wx.hideLoading()
          
          // 验证并设置压缩后的图片
          this.validateAndSetImage(compressedPath)
          
        } catch (compressError) {
          wx.hideLoading()
          console.error('图片压缩失败:', compressError)
          
          // 压缩失败时使用原图
          this.validateAndSetImage(tempFilePath)
        }
      }
    } catch (error) {
      wx.hideLoading()
      console.error('选择图片失败:', error)
      if (error.errMsg && !error.errMsg.includes('cancel')) {
        wx.showToast({
          title: '选择图片失败',
          icon: 'error',
          duration: 2000
        })
      }
    }
  },

  // 选择媒体文件 (Promise化)
  chooseMedia() {
    return new Promise((resolve, reject) => {
      wx.chooseMedia({
        count: 1,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        maxDuration: 30,
        camera: 'back',
        success: resolve,
        fail: reject
      })
    })
  },

  // 图片加载错误处理
  onImageError(e) {
    console.error('图片加载错误:', e.detail)
    wx.showToast({
      title: '图片加载失败',
      icon: 'error'
    })
    
    this.setData({
      showUploadArea: true,
      originalImage: ''
    })
  },

  // 重新选择图片
  reSelectImage() {
    this.setData({
      showUploadArea: true,
      originalImage: '',
      imageInfo: null,
      scale: 1,
      translateX: 0,
      translateY: 0
    })
  },

  // 放大
  zoomIn() {
    const newScale = Math.min(this.data.scale * 1.2, 3) // 最大3倍
    this.setData({
      scale: newScale,
      scalePercent: Math.round(newScale * 100)
    })
  },

  // 缩小
  zoomOut() {
    const newScale = Math.max(this.data.scale / 1.2, 0.5) // 最小0.5倍
    this.setData({
      scale: newScale,
      scalePercent: Math.round(newScale * 100)
    })
  },

  // 计算两点间距离
  getDistance(touch1, touch2) {
    return Math.sqrt(
      Math.pow(touch1.clientX - touch2.clientX, 2) + 
      Math.pow(touch1.clientY - touch2.clientY, 2)
    )
  },

  // 计算两点中心
  getCenter(touch1, touch2) {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2
    }
  },

})
