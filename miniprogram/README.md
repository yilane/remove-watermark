# IOPaint 微信小程序

IOPaint微信小程序是基于现有IOPaint项目开发的移动端图像修复服务，为用户提供便捷的AI智能图像处理功能。

## 项目结构

```
miniprogram/
├── app.js                  # 小程序入口文件
├── app.json               # 小程序全局配置
├── sitemap.json           # 微信索引配置
├── project.config.json    # 项目配置
├── pages/                 # 页面目录
│   ├── login/            # 登录页
│   ├── index/            # 首页（主要功能入口）
│   ├── editor/           # 图像编辑页
│   ├── result/           # 结果展示页
│   ├── history/          # 历史记录页
│   └── profile/          # 个人中心页
├── components/           # 自定义组件
├── utils/               # 工具函数
│   └── request.js       # 网络请求封装
├── services/            # API服务
├── styles/              # 全局样式
└── images/              # 静态图片资源
```

## 功能特性

### 已实现功能（任务04+05）

1. **小程序基础框架**
   - 页面路由配置
   - 底部TabBar导航
   - 全局状态管理
   - 网络请求封装

2. **微信登录功能**
   - 微信一键登录
   - 用户信息获取
   - Token管理
   - 登录状态持久化

3. **核心页面**
   - 登录页：优雅的登录界面
   - 首页：功能入口和最近记录
   - 历史记录页：记录管理和筛选
   - 个人中心页：用户信息和设置

### 待实现功能（后续任务）

- 图像上传和处理
- 蒙版绘制工具
- AI修复功能集成
- WebSocket实时进度
- 结果展示和保存

## 技术栈

- **框架**: 微信小程序原生开发
- **基础库**: 2.19.4+
- **状态管理**: app.js + getApp()
- **网络请求**: 自定义Request类
- **UI设计**: 参考原型图设计

## 开发指南

### 环境要求

1. 微信开发者工具
2. 微信小程序开发账号
3. 后端服务（IOPaint API）

### 快速开始

1. 使用微信开发者工具打开项目
2. 配置AppID（在project.config.json中）
3. 修改服务器地址（在app.js中的serverUrl）
4. 编译运行

### 配置说明

#### 服务器配置
在`app.js`中修改`serverUrl`：
```javascript
globalData: {
  serverUrl: 'https://your-api-domain.com'
}
```

#### 页面配置
在`app.json`中配置页面路由和TabBar

## API接口

### 认证相关
- `POST /api/auth/wechat-login` - 微信登录
- `GET /api/auth/user-info` - 获取用户信息

### 历史记录
- `GET /api/history/recent` - 获取最近记录
- `GET /api/history/list` - 获取历史列表

## 设计规范

### 颜色系统
- 主色调：#2563eb（科技蓝）
- 辅助色：#1d4ed8（深蓝）
- 成功色：#10b981（绿色）
- 警告色：#f59e0b（橙色）
- 错误色：#ef4444（红色）

### 字体规范
- 标题：36rpx-72rpx，font-weight: 600-700
- 正文：28rpx-32rpx，font-weight: 400-500
- 辅助文字：24rpx，color: #6b7280

## 任务完成状态

- ✅ 任务04：小程序基础框架搭建
- ✅ 任务05：微信登录功能实现

## 下一步计划

1. 任务06：图像上传功能开发
2. 任务07：蒙版绘制工具开发
3. 任务08：AI图像修复功能集成
4. 任务09：WebSocket实时进度推送
5. 任务10：结果展示和保存功能

## 注意事项

1. 图片资源需要补充（目前使用占位符）
2. API接口需要根据实际后端实现调整
3. 微信小程序相关配置需要根据实际AppID调整
4. 部分页面为基础框架，具体功能将在后续任务中实现 