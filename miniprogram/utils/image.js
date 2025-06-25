// utils/image.js

// 获取图片信息
const getImageInfo = (src) => {
  return new Promise((resolve, reject) => {
    wx.getImageInfo({
      src,
      success: resolve,
      fail: reject
    })
  })
}

// 图片格式验证
const validateImageFormat = (filePath) => {
  const supportedFormats = ['.jpg', '.jpeg', '.png', '.webp']
  const extension = filePath.toLowerCase().substring(filePath.lastIndexOf('.'))
  return supportedFormats.includes(extension)
}

// 图片大小验证
const validateImageSize = (filePath, maxSize = 10 * 1024 * 1024) => {
  return new Promise((resolve) => {
    wx.getFileInfo({
      filePath,
      success: (res) => {
        resolve(res.size <= maxSize)
      },
      fail: () => {
        resolve(false)
      }
    })
  })
}

// 图片压缩
const compressImage = (filePath, options = {}) => {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = 'jpg'
  } = options

  return new Promise((resolve, reject) => {
    getImageInfo(filePath).then(imageInfo => {
      // 计算压缩后的尺寸
      const { width, height } = calculateSize(
        imageInfo.width,
        imageInfo.height,
        maxWidth,
        maxHeight
      )

      // 如果图片尺寸已经在要求范围内，直接返回原图
      if (imageInfo.width <= maxWidth && imageInfo.height <= maxHeight) {
        resolve(filePath)
        return
      }

      // 创建临时canvas进行压缩
      const canvasId = `compress_${Date.now()}`
      
      // 创建canvas上下文
      const ctx = wx.createCanvasContext(canvasId)
      
      // 绘制图片
      ctx.drawImage(filePath, 0, 0, width, height)
      ctx.draw(false, () => {
        // 导出压缩后的图片
        wx.canvasToTempFilePath({
          canvasId,
          fileType: format,
          quality,
          success: (res) => {
            resolve(res.tempFilePath)
          },
          fail: reject
        })
      })
    }).catch(reject)
  })
}

// 计算压缩尺寸
const calculateSize = (originalWidth, originalHeight, maxWidth, maxHeight) => {
  let width = originalWidth
  let height = originalHeight
  
  // 按比例缩放
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }
  
  return {
    width: Math.floor(width),
    height: Math.floor(height)
  }
}

// 生成图片缩略图
const generateThumbnail = (filePath, options = {}) => {
  const {
    width = 200,
    height = 200,
    quality = 0.7
  } = options

  return compressImage(filePath, {
    maxWidth: width,
    maxHeight: height,
    quality
  })
}

// 清除临时文件
const clearTempFiles = (filePaths) => {
  const fs = wx.getFileSystemManager()
  
  filePaths.forEach(filePath => {
    try {
      fs.unlinkSync(filePath)
    } catch (error) {
      console.log('清除临时文件失败:', filePath)
    }
  })
}

module.exports = {
  getImageInfo,
  validateImageFormat,
  validateImageSize,
  compressImage,
  calculateSize,
  generateThumbnail,
  clearTempFiles
} 