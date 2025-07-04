# AI图像修复工具小程序端需求文档

## 1. 项目概述

### 1.1 项目背景
基于现有IOPaint项目（AI图像修复工具），开发微信小程序端，为用户提供便捷的移动端图像修复服务。

### 1.2 项目目标
- 提供完整的图像修复功能，包括图像上传、蒙版绘制、AI修复等
- 操作流程 首页 → 直接选择图片 → 一键处理 → 自动跳传
- 实现用户认证和会话管理
- 优化移动端用户体验
- 保持与现有后端API的兼容性

### 1.3 技术架构
- **前端**：微信小程序原生框架 + TDesign MiniProgram UI组件库
- **后端**：复用现有FastAPI服务，增加用户认证中间件
- **通信**：HTTP RESTful API + WebSocket（用于进度推送）
- **数据库**：MySQL（新增用户管理）

## 2. 功能需求

### 2.1 用户认证模块

#### 2.1.1 微信一键登录
- **功能描述**：使用微信小程序的授权登录，无需注册流程
- **登录流程**：
  1. 用户点击"微信登录"按钮
  2. 调用`wx.login()`获取临时登录凭证code
  3. 调用`wx.getUserProfile()`获取用户基本信息（可选）
  4. 将code发送到后端，后端调用微信接口验证并获取openid
  5. 后端生成JWT Token并返回
  6. 小程序存储Token，完成登录
- **用户信息**：
  - OpenID（微信用户唯一标识）
  - 昵称（用户授权后获取）
  - 头像（用户授权后获取）
  - 登录时间
- **接口需求**：
  - `POST /api/v1/auth/wechat-login` - 微信登录
  - `POST /api/v1/auth/refresh` - Token刷新

#### 2.1.2 自动登录
- **功能描述**：用户下次打开小程序时自动登录
- **实现方式**：
  1. 检查本地存储的Token是否有效
  2. 如果Token有效，直接进入应用
  3. 如果Token无效，静默调用微信登录接口
  4. 登录成功后更新Token
- **静默登录**：无需用户操作，在后台完成身份验证

### 2.2 图像处理模块

#### 2.2.1 图像上传
- **功能描述**：用户上传待修复的图像
- **支持格式**：JPG、PNG、WEBP
- **文件限制**：单个文件最大10MB
- **上传方式**：
  - 从相册选择
  - 拍照上传
- **预处理**：
  - 图像压缩（保持质量前提下减小文件体积）
  - 格式转换（统一转为PNG格式）
- **接口需求**：
  - `POST /api/v1/upload/image` - 图像上传

#### 2.2.2 蒙版绘制
- **功能描述**：用户在图像上标记需要修复的区域
- **绘制工具**：
  - 画笔工具（可调节笔刷大小）
  - 橡皮擦工具（撤销错误标记）
  - 清除全部（重新开始）
  - 智能选择（基于颜色相似度自动选择区域）
- **交互体验**：
  - 支持触摸绘制
  - 实时预览蒙版效果
  - 支持缩放和平移查看细节
- **技术实现**：
  - 使用Canvas组件进行绘制
  - 实时生成蒙版数据

#### 2.2.3 AI图像修复
- **功能描述**：基于用户绘制的蒙版执行AI修复
- **模型选择**：
  - 快速模式（lama模型，速度快）
  - 高质量模式（更高级的模型，效果好但耗时长）
- **处理流程**：
  1. 用户确认蒙版并提交
  2. 显示处理进度条
  3. 通过WebSocket接收实时进度更新
  4. 处理完成后展示结果
- **接口需求**：
  - `POST /api/v1/inpaint` - 执行修复任务
  - `WS /api/v1/ws` - WebSocket连接（进度推送）

#### 2.2.4 结果管理
- **功能描述**：处理结果的查看、保存和分享
- **查看功能**：
  - 原图与修复后图像对比
  - 支持缩放查看细节
  - 支持全屏查看
- **保存功能**：
  - 保存到手机相册
  - 保存到个人云端空间
- **分享功能**：
  - 生成分享链接
  - 分享到微信好友/朋友圈
  - 分享到其他社交平台

### 2.3 个人中心模块

#### 2.3.1 用户信息
- **功能描述**：查看和编辑个人信息
- **信息项**：
  - 头像（支持上传自定义头像）
  - 昵称
  - 手机号
  - 注册时间
  - 使用统计（处理图片数量、使用时长等）

#### 2.3.2 历史记录
- **功能描述**：查看历史处理记录
- **记录内容**：
  - 原始图像缩略图
  - 处理时间
  - 使用的模型
  - 处理状态（成功/失败）
- **操作功能**：
  - 重新下载结果图像
  - 删除历史记录
  - 基于历史图像重新处理

#### 2.3.3 设置中心
- **功能描述**：应用设置管理
- **设置项**：
  - 默认图像质量设置
  - 自动保存设置
  - 通知设置
  - 缓存清理
  - 关于我们
  - 隐私政策
  - 用户协议

## 3. 技术需求

### 3.1 小程序端技术栈

#### 3.1.1 开发框架选择
- **选定方案**：原生微信小程序开发
- **优势**：
  - 性能最优，直接调用微信小程序原生API
  - 完整支持微信小程序所有特性和功能
  - 官方支持，稳定性和兼容性最佳
  - 开发工具完善，调试方便

#### 3.1.2 UI框架
- **选定**：TDesign MiniProgram UI组件库
- **优势**：
  - 腾讯官方设计语言，兼容性和稳定性最佳
  - 组件丰富，提供50+高质量组件
  - 设计现代，符合TDesign设计规范
  - TypeScript支持，开发体验优秀
  - 按需加载，轻量级，性能优秀
- **要求**：
  - 支持深色模式
  - 组件丰富，样式现代
  - 性能优良，体积小

#### 3.1.3 状态管理
- **方案**：原生小程序全局状态管理
- **实现方式**：
  - 使用getApp()获取全局应用实例进行状态管理
  - 结合wx.setStorageSync/wx.getStorageSync进行数据持久化
  - 使用自定义事件机制进行组件间通信
- **管理内容**：
  - 用户认证状态
  - 图像处理状态
  - 应用配置信息

#### 3.1.4 网络请求
- **HTTP客户端**：基于wx.request封装
- **功能要求**：
  - 请求/响应拦截器
  - 自动Token附加
  - 错误统一处理
  - 请求重试机制
- **WebSocket**：wx.connectSocket
  - 自动重连机制
  - 心跳检测

### 3.2 后端扩展需求

#### 3.2.1 用户认证中间件
- **技术选型**：FastAPI + JWT
- **功能要求**：
  - JWT Token生成和验证
  - Token自动刷新
  - 用户权限管理
  - 请求频率限制

#### 3.2.2 数据库设计
```sql
-- 用户表（简化版）
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    openid VARCHAR(255) UNIQUE NOT NULL,     -- 微信OpenID
    nickname VARCHAR(100),                   -- 微信昵称
    avatar_url VARCHAR(255),                 -- 微信头像
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 处理记录表
CREATE TABLE process_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    original_image_url VARCHAR(255),
    result_image_url VARCHAR(255),
    mask_data TEXT,
    model_name VARCHAR(50),
    status VARCHAR(20), -- pending, processing, completed, failed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 3.2.3 新增API端点
```python
# 用户认证相关（简化版）
POST /api/v1/auth/wechat-login       # 微信登录
POST /api/v1/auth/refresh            # Token刷新

# 用户管理相关
GET  /api/v1/user/profile            # 获取用户信息
PUT  /api/v1/user/profile            # 更新用户信息

# 历史记录相关
GET  /api/v1/user/records            # 获取处理历史
DELETE /api/v1/user/records/{id}     # 删除历史记录

# 文件服务增强
POST /api/v1/upload/image            # 图像上传（增加用户关联）
GET  /api/v1/download/image/{id}     # 图像下载（权限验证）
```

### 3.3 性能优化需求

#### 3.3.1 图像处理优化
- **图像压缩**：上传前在小程序端进行图像压缩
- **格式转换**：统一转换为PNG格式，保证质量
- **尺寸限制**：限制最大分辨率（如4096x4096）
- **批量处理**：支持多张图片队列处理

#### 3.3.2 缓存策略
- **本地缓存**：
  - 用户信息缓存
  - 历史记录缓存
  - 处理结果缓存
- **服务端缓存**：
  - 模型加载缓存
  - 处理结果临时缓存
  - API响应缓存

#### 3.3.3 网络优化
- **CDN加速**：静态资源和图片文件使用CDN
- **请求合并**：减少不必要的API调用
- **断点续传**：大文件上传支持断点续传
- **离线支持**：基本功能支持离线使用

## 4. 用户体验需求

### 4.1 界面设计要求

#### 4.1.1 设计风格
- **整体风格**：现代简约、清新自然
- **色彩搭配**：主色调采用科技蓝，辅色采用温暖橙
- **字体**：系统默认字体，确保清晰易读
- **图标**：使用一致的图标风格，线性图标为主

#### 4.1.2 布局原则
- **简洁性**：每个页面功能明确，避免冗余元素
- **一致性**：保持整个应用的视觉和交互一致性
- **可访问性**：支持无障碍访问，合理的色彩对比度
- **响应式**：适配不同尺寸的手机屏幕

#### 4.1.3 关键页面设计
- **首页**：快速开始按钮、功能介绍、最近记录
- **图像编辑页**：工具栏、画布区域、操作按钮
- **处理进度页**：进度条、预估时间、取消按钮
- **结果页面**：对比展示、操作按钮、分享功能

### 4.2 交互体验要求

#### 4.2.1 操作流程
- **新手引导**：首次使用提供操作指导
- **快速上手**：主要功能在3步内完成
- **容错处理**：提供撤销、重做等容错机制
- **状态反馈**：及时的操作反馈和状态提示

#### 4.2.2 手势交互
- **缩放**：双指缩放查看图像细节
- **平移**：单指拖动移动图像位置
- **绘制**：单指绘制蒙版，支持压感
- **长按**：长按触发上下文菜单

#### 4.2.3 动画效果
- **页面转场**：平滑的页面切换动画
- **加载动画**：处理过程中的加载指示
- **反馈动画**：按钮点击、操作成功的视觉反馈
- **骨架屏**：数据加载时的骨架屏效果

### 4.3 错误处理和异常情况

#### 4.3.1 网络异常
- **离线检测**：检测网络状态变化
- **重试机制**：自动重试失败的请求
- **离线提示**：友好的离线状态提示
- **缓存降级**：网络不好时使用缓存数据

#### 4.3.2 处理异常
- **模型错误**：AI模型处理失败的提示和建议
- **文件错误**：不支持的文件格式或损坏文件的处理
- **超时处理**：长时间处理的超时机制
- **内存不足**：大图片处理时的内存管理

#### 4.3.3 用户引导
- **错误提示**：清晰明确的错误信息
- **解决建议**：针对错误提供解决方案
- **帮助文档**：常见问题和使用帮助
- **客服支持**：提供用户反馈渠道

## 5. 安全需求

### 5.1 数据安全

#### 5.1.1 用户数据保护
- **密码加密**：使用bcrypt等安全算法加密存储
- **敏感信息**：手机号等敏感信息加密存储
- **数据传输**：使用HTTPS加密传输
- **Token安全**：JWT Token设置合理的过期时间

#### 5.1.2 图像数据安全
- **上传安全**：验证上传文件的类型和内容
- **存储安全**：用户图像数据独立存储，权限隔离
- **访问控制**：只有用户本人可以访问自己的图像
- **自动清理**：定期清理过期的临时文件

### 5.2 接口安全

#### 5.2.1 身份验证
- **Token验证**：所有需要认证的接口都需要验证Token
- **权限控制**：不同用户只能访问自己的数据
- **会话管理**：Token过期后需要重新登录
- **多设备登录**：支持多设备同时登录但有数量限制

#### 5.2.2 防攻击措施
- **频率限制**：限制API调用频率，防止恶意攻击
- **输入验证**：严格验证所有用户输入
- **SQL注入防护**：使用参数化查询
- **XSS防护**：过滤和转义用户输入内容

## 6. 部署和运维需求

### 6.1 部署环境

#### 6.1.1 服务器配置
- **推荐配置**：4核CPU，8GB内存，100GB SSD
- **操作系统**：Ubuntu 20.04 LTS或CentOS 8
- **Python版本**：Python 3.8+
- **数据库**：MySQL 8.0+（生产环境）

#### 6.1.2 容器化部署
- **Docker镜像**：更新现有Dockerfile支持认证功能
- **Docker Compose**：编排应用服务和数据库服务
- **环境变量**：通过环境变量管理配置信息
- **数据持久化**：数据库和文件存储的持久化

### 6.2 监控和日志

#### 6.2.1 应用监控
- **健康检查**：定期检查服务状态
- **性能监控**：CPU、内存、网络使用情况
- **错误监控**：捕获和报告应用异常
- **用户行为**：统计用户使用情况和活跃度

#### 6.2.2 日志管理
- **结构化日志**：使用JSON格式记录日志
- **日志级别**：合理设置日志级别（DEBUG、INFO、WARN、ERROR）
- **日志轮转**：防止日志文件过大
- **敏感信息**：避免在日志中记录敏感信息

### 6.3 备份和恢复

#### 6.3.1 数据备份
- **数据库备份**：使用mysqldump定期备份用户数据和处理记录
- **文件备份**：备份用户上传的图像文件
- **配置备份**：备份应用配置和证书文件
- **备份频率**：每日增量备份，每周全量备份

#### 6.3.2 灾难恢复
- **恢复流程**：制定详细的灾难恢复流程
- **恢复测试**：定期测试备份文件的可用性
- **多地备份**：在不同地理位置保存备份
- **恢复时间**：目标恢复时间不超过4小时

## 7. 项目计划

### 7.1 开发阶段

#### 7.1.1 第一阶段：基础架构（2周）
- 搭建小程序开发环境
- 实现用户认证系统
- 完成后端API扩展
- 建立数据库模型

#### 7.1.2 第二阶段：核心功能（3周）
- 实现图像上传功能
- 开发蒙版绘制工具
- 集成AI图像修复
- 实现结果展示和保存

#### 7.1.3 第三阶段：用户体验（2周）
- 完善用户界面设计
- 优化交互体验
- 实现历史记录管理
- 添加个人中心功能

#### 7.1.4 第四阶段：测试优化（1周）
- 功能测试和性能测试
- 安全测试和压力测试
- 用户体验测试
- Bug修复和优化

### 7.2 里程碑节点

- **Week 2**：完成用户认证和基础架构
- **Week 5**：完成核心图像处理功能
- **Week 7**：完成用户界面和体验优化
- **Week 8**：完成测试并准备发布

### 7.3 团队配置

- **前端开发**：1名（小程序开发）
- **后端开发**：1名（FastAPI和认证系统）
- **UI设计师**：1名（界面设计和交互设计）
- **测试工程师**：1名（功能测试和性能测试）
- **项目经理**：1名（项目协调和进度管理）

## 8. 成功指标

### 8.1 技术指标
- **响应时间**：API响应时间<500ms
- **处理速度**：图像处理时间<30秒（普通模式）
- **成功率**：处理成功率>95%
- **并发支持**：支持100+用户同时使用

### 8.2 用户体验指标
- **用户满意度**：用户评分>4.5分
- **操作便捷性**：主要功能3步内完成
- **错误率**：用户操作错误率<5%
- **学习成本**：新用户5分钟内掌握基本操作

### 8.3 业务指标
- **用户活跃度**：月活跃用户>1000
- **功能使用率**：核心功能使用率>80%
- **用户留存**：7日留存率>50%
- **处理量**：日处理图片数>100张

---

*本需求文档基于IOPaint项目架构分析制定，随着开发进展可能需要适当调整和完善。*