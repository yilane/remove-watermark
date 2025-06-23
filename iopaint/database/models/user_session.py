from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.sqlite import JSON

from ..base import BaseModel

class UserSession(BaseModel):
    """用户会话表模型"""
    __tablename__ = "user_sessions"
    
    # 关联用户
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    
    # 会话信息
    session_token = Column(String(255), unique=True, nullable=False, index=True, comment="会话令牌")
    device_info = Column(JSON, nullable=True, comment="设备信息")
    ip_address = Column(String(45), nullable=True, comment="IP地址")
    user_agent = Column(Text, nullable=True, comment="用户代理字符串")
    
    # 会话状态
    is_active = Column(Boolean, default=True, comment="是否活跃")
    last_activity_at = Column(DateTime(timezone=True), nullable=True, comment="最后活跃时间")
    expires_at = Column(DateTime(timezone=True), nullable=False, comment="过期时间")
    
    # 关联关系
    user = relationship("User", back_populates="sessions")
    
    def __repr__(self):
        return f"<UserSession(id={self.id}, user_id={self.user_id}, is_active={self.is_active})>"
    
    @property
    def is_expired(self) -> bool:
        """检查会话是否已过期"""
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """检查会话是否有效"""
        return self.is_active and not self.is_expired
    
    @property
    def remaining_time_minutes(self) -> int:
        """获取剩余有效时间(分钟)"""
        if self.is_expired:
            return 0
        
        from datetime import datetime
        delta = self.expires_at - datetime.utcnow()
        return int(delta.total_seconds() / 60)
    
    def update_activity(self, db_session=None):
        """更新最后活跃时间"""
        from datetime import datetime
        self.last_activity_at = datetime.utcnow()
        if db_session:
            db_session.commit()
    
    def deactivate(self, db_session=None):
        """停用会话"""
        self.is_active = False
        if db_session:
            db_session.commit()
    
    def extend_expiry(self, hours: int = 24, db_session=None):
        """延长会话过期时间"""
        from datetime import datetime, timedelta
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
        if db_session:
            db_session.commit() 