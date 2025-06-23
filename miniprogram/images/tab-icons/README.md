# TabBar 图标说明

## 需要的图标文件

请在此目录下添加以下图标文件（建议尺寸 81x81 像素）：

### 首页图标
- `home.png` - 首页未选中状态
- `home-active.png` - 首页选中状态

### 历史图标  
- `history.png` - 历史未选中状态
- `history-active.png` - 历史选中状态

### 个人中心图标
- `profile.png` - 个人中心未选中状态  
- `profile-active.png` - 个人中心选中状态

## 设计要求

- **尺寸**：建议 81x81 像素（@3x），54x54（@2x），27x27（@1x）
- **格式**：PNG 格式，支持透明背景
- **风格**：线性图标，简洁清晰
- **颜色**：
  - 未选中状态：#7A7E83（灰色）
  - 选中状态：#0052d9（蓝色）

## 图标建议

可以从以下资源获取图标：
- [IconFont](https://www.iconfont.cn/) - 阿里巴巴图标库
- [Feather Icons](https://feathericons.com/) - 简洁线性图标
- [Heroicons](https://heroicons.com/) - 现代图标库

## 临时方案

目前已移除图标路径，使用纯文本 tabBar。
如需恢复图标，请添加相应文件后修改 `app.json` 中的 tabBar 配置。 