from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.orm import relationship

from ..base import BaseModel

class User(BaseModel):
    """用户表模型"""
    __tablename__ = "users"
    
    # 微信相关字段
    openid = Column(String(255), unique=True, nullable=False, index=True, comment="微信OpenID")
    union_id = Column(String(255), nullable=True, index=True, comment="微信UnionID")
    
    # 用户基本信息
    nickname = Column(String(100), nullable=True, comment="用户昵称")
    avatar_url = Column(String(500), nullable=True, comment="头像URL")
    phone = Column(String(20), nullable=True, comment="手机号")
    email = Column(String(100), nullable=True, comment="邮箱")
    
    # 账户状态
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_premium = Column(Boolean, default=False, comment="是否付费用户")
    usage_quota = Column(Integer, default=10, comment="每日使用配额")
    
    # 登录统计
    last_login_at = Column(DateTime(timezone=True), nullable=True, comment="最后登录时间")
    login_count = Column(Integer, default=0, comment="登录次数")
    
    # 关联关系
    process_records = relationship("ProcessRecord", back_populates="user", cascade="all, delete-orphan")
    file_storage = relationship("FileStorage", back_populates="user", cascade="all, delete-orphan")
    sessions = relationship("UserSession", back_populates="user", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<User(id={self.id}, openid={self.openid}, nickname={self.nickname})>"
    
    @property
    def is_quota_exceeded(self) -> bool:
        """检查是否超出每日配额"""
        from datetime import datetime, timedelta
        today = datetime.now().date()
        
        # 统计今日处理次数
        today_count = 0
        for record in self.process_records:
            if record.created_at.date() == today and record.status == "completed":
                today_count += 1
        
        return today_count >= self.usage_quota if not self.is_premium else False
    
    @property
    def today_usage_count(self) -> int:
        """获取今日使用次数"""
        from datetime import datetime
        today = datetime.now().date()
        
        count = 0
        for record in self.process_records:
            if record.created_at.date() == today and record.status == "completed":
                count += 1
        return count 