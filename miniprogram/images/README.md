# 图片资源说明

本小程序使用了以下策略来解决图片资源问题：

## 解决方案

### 1. Emoji 图标替代
为避免本地图片资源缺失错误，我们使用 Emoji 图标替代大部分装饰性图片：

- 📸 - 空状态图标
- 🎨 - 功能图标  
- ✨ - 操作图标
- 🗑️ - 移除物体
- 👤 - 移除人物
- 🅰️ - 移除文字
- ⚡ - 图像增强
- 🔔 - 通知图标
- 微 - 微信图标

### 2. 外部图片服务
对于需要真实图片的场景（如历史记录缩略图），使用 picsum.photos 外部服务：

```
https://picsum.photos/300/300?random=1
https://picsum.photos/300/300?random=2
```

### 3. CSS 样式图标
用户头像使用 CSS 渐变背景 + 首字母的方式生成。

## 优势

1. **无依赖性**：不依赖本地图片资源，避免 500 错误
2. **快速加载**：Emoji 是系统字体，加载速度快
3. **跨平台兼容**：Emoji 在各个平台都有良好支持
4. **易于维护**：不需要管理图片文件

## 如需使用真实图片

如果后续需要使用真实的图片资源，请将图片文件放置在此目录下，并更新相应的文件路径。

### 推荐的图片规格：

- TabBar 图标：81x81px (3倍图)
- 功能图标：64x64px
- 缩略图：300x300px
- 空状态插图：400x300px

## 当前状态

项目中的图片资源目前使用占位符路径，需要根据实际需求添加对应的图片文件。

## 需要的图片资源

### TabBar图标 (images/tab-icons/)
- home.png / home-active.png - 首页图标
- history.png / history-active.png - 历史图标  
- profile.png / profile-active.png - 我的图标

### 功能图标
- logo.png - 应用Logo
- wechat-icon.png - 微信图标
- ai-repair.png - AI修复功能图标
- wand.png - 魔法棒图标
- bell.png - 通知铃铛图标
- default-avatar.png - 默认头像
- settings.png - 设置图标
- info.png - 信息图标
- shield.png - 隐私图标
- document.png - 文档图标

### 快捷功能图标
- remove-object.png - 移除物体
- remove-person.png - 移除人物
- remove-text.png - 移除文字
- enhance.png - 图像增强

### 其他图标
- arrow-down.png - 下箭头
- arrow-right.png - 右箭头
- delete.png - 删除图标
- empty-history.png - 空状态图标

### 示例图片
- thumb1.jpg - 缩略图示例1
- thumb2.jpg - 缩略图示例2
- share-image.jpg - 分享图片

## 图片规格建议

- **图标**: 建议使用SVG或高分辨率PNG
- **TabBar图标**: 81px × 81px
- **功能图标**: 48px × 48px 或 64px × 64px
- **缩略图**: 300px × 300px
- **Logo**: 200px × 200px

## 临时解决方案

1. 当前小程序已配置为使用系统默认TabBar图标
2. 其他图片引用暂时使用占位符路径
3. 可以通过网络图片URL临时替代本地图片

## 获取图片资源方式

1. 使用图标库：iconfont、iconify等
2. 设计师提供定制图标
3. 使用免费图标资源：Heroicons、Lucide等
4. AI生成图标工具 