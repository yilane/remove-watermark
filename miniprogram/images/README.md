# 图片资源说明

## 默认头像

由于小程序加载本地图片资源的限制，建议使用以下方案：

### 方案一：使用emoji替代
在代码中使用emoji图标替代图片：
```javascript
// 在profile.wxml中
<view class="default-avatar">👤</view>
```

### 方案二：创建base64图片
使用base64编码的小图片数据。

### 方案三：使用占位符
显示用户名的首字母作为头像。

## 当前使用方案
项目已修改为使用emoji头像，避免图片加载问题。 