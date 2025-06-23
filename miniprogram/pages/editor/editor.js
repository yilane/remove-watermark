// pages/editor/editor.js
const { post, uploadFile } = require('../../utils/request')

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
    
    // 画布相关
    canvasWidth: 0,
    canvasHeight: 0,
    drawing: false,
    lastPoint: null,
    strokes: [] // 存储所有笔画，用于撤销
  },

  onLoad(options) {
    if (options.image) {
      this.setData({
        originalImage: decodeURIComponent(options.image)
      })
    }
    
    // 初始化画布
    this.initCanvas()
  },

  onReady() {
    // 获取画布对象
    this.setupCanvas()
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
    const query = this.createSelectorQuery()
    
    // 绘制画布
    query.select('#drawCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)
          
          // 设置画笔样式
          ctx.lineCap = 'round'
          ctx.lineJoin = 'round'
          ctx.globalCompositeOperation = 'source-over'
          
          this.drawCanvas = canvas
          this.drawCtx = ctx
        }
      })
    
    // 蒙版画布
    query.select('#maskCanvas')
      .fields({ node: true, size: true })
      .exec((res) => {
        if (res[0]) {
          const canvas = res[0].node
          const ctx = canvas.getContext('2d')
          
          const dpr = wx.getSystemInfoSync().pixelRatio
          canvas.width = res[0].width * dpr
          canvas.height = res[0].height * dpr
          ctx.scale(dpr, dpr)
          
          this.maskCanvas = canvas
          this.maskCtx = ctx
        }
      })
  },

  // 图片加载完成
  onImageLoad(e) {
    console.log('图片加载完成:', e.detail)
  },

  // 触摸开始
  onTouchStart(e) {
    if (!this.drawCtx) return
    
    this.setData({ drawing: true })
    
    const touch = e.touches[0]
    const point = this.getTouchPoint(touch)
    
    this.setData({ lastPoint: point })
    
    // 设置画笔属性
    this.updateBrushStyle()
    
    // 开始新的笔画
    this.drawCtx.beginPath()
    this.drawCtx.moveTo(point.x, point.y)
    
    // 记录笔画开始
    this.currentStroke = [point]
  },

  // 触摸移动
  onTouchMove(e) {
    if (!this.data.drawing || !this.drawCtx) return
    
    const touch = e.touches[0]
    const point = this.getTouchPoint(touch)
    
    // 绘制线条
    this.drawCtx.lineTo(point.x, point.y)
    this.drawCtx.stroke()
    
    this.setData({ lastPoint: point })
    
    // 记录笔画点
    this.currentStroke.push(point)
  },

  // 触摸结束
  onTouchEnd() {
    if (!this.data.drawing) return
    
    this.setData({ drawing: false })
    
    // 保存笔画用于撤销
    if (this.currentStroke && this.currentStroke.length > 0) {
      const strokes = [...this.data.strokes, {
        points: this.currentStroke,
        tool: this.data.currentTool,
        size: this.data.brushSize
      }]
      this.setData({ strokes })
    }
    
    // 更新蒙版
    this.updateMask()
  },

  // 获取触摸点相对画布的坐标
  getTouchPoint(touch) {
    const query = this.createSelectorQuery()
    return new Promise((resolve) => {
      query.select('#drawCanvas')
        .boundingClientRect((rect) => {
          resolve({
            x: touch.clientX - rect.left,
            y: touch.clientY - rect.top
          })
        })
        .exec()
    })
  },

  // 更新画笔样式
  updateBrushStyle() {
    if (!this.drawCtx) return
    
    const { currentTool, brushSize } = this.data
    
    this.drawCtx.lineWidth = brushSize
    
    if (currentTool === 'brush') {
      this.drawCtx.globalCompositeOperation = 'source-over'
      this.drawCtx.strokeStyle = 'rgba(239, 68, 68, 0.8)'
    } else if (currentTool === 'eraser') {
      this.drawCtx.globalCompositeOperation = 'destination-out'
    }
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
      
      // 设置笔画样式
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
  }
})
