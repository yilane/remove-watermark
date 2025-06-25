// services/upload.js
const { post } = require('../utils/request')

// 上传图片
const uploadImage = (filePath, options = {}) => {
  return new Promise((resolve, reject) => {
    const app = getApp()
    
    const uploadTask = wx.uploadFile({
      url: app.globalData.serverUrl + '/api/upload/image',
      filePath,
      name: 'file',
      formData: {
        ...options
      },
      header: {
        'Authorization': `Bearer ${app.globalData.token}`
      },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = JSON.parse(res.data)
            resolve(data)
          } catch (error) {
            reject(new Error('响应数据解析失败'))
          }
        } else {
          reject(new Error(`上传失败: ${res.statusCode}`))
        }
      },
      fail: (error) => {
        reject(error)
      }
    })

    // 返回上传任务，支持监听进度和取消
    resolve({
      task: uploadTask,
      onProgress: (callback) => {
        uploadTask.onProgressUpdate(callback)
      },
      abort: () => {
        uploadTask.abort()
      }
    })
  })
}

// 批量上传图片
const uploadMultipleImages = (filePaths, options = {}) => {
  const uploadPromises = filePaths.map(filePath => 
    uploadImage(filePath, options)
  )
  
  return Promise.all(uploadPromises)
}

// 检查上传状态
const checkUploadStatus = (uploadId) => {
  return post('/api/upload/status', { uploadId })
}

// 删除上传的文件
const deleteUploadedFile = (fileId) => {
  return post('/api/upload/delete', { fileId })
}

module.exports = {
  uploadImage,
  uploadMultipleImages,
  checkUploadStatus,
  deleteUploadedFile
} 