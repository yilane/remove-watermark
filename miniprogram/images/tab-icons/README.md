# TabBar图标说明

## 需要的图标文件

### 首页图标
- `home.png` - 未选中状态（灰色）
- `home-active.png` - 选中状态（蓝色 #2563eb）

### 历史图标  
- `history.png` - 未选中状态（灰色）
- `history-active.png` - 选中状态（蓝色 #2563eb）

### 我的图标
- `profile.png` - 未选中状态（灰色）
- `profile-active.png` - 选中状态（蓝色 #2563eb）

## 图标规格要求

- **尺寸**: 81px × 81px
- **格式**: PNG
- **背景**: 透明
- **颜色**: 
  - 未选中: #7A7E83
  - 选中: #2563eb

## 临时解决方案

目前app.json已配置为不使用自定义图标，系统会使用默认图标。
如需自定义图标，请按照上述规格准备图标文件，然后更新app.json配置。

## 图标更新步骤

1. 准备6个图标文件放入此目录
2. 在app.json中添加iconPath和selectedIconPath配置
3. 重新编译小程序 