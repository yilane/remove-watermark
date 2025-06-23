from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from ..base import BaseModel

class FileStorage(BaseModel):
    """文件存储表模型"""
    __tablename__ = "file_storage"
    
    # 关联用户 (可选，系统文件可以为空)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True, index=True, comment="用户ID")
    
    # 文件基本信息
    file_path = Column(String(500), nullable=False, index=True, comment="文件存储路径")
    file_name = Column(String(255), nullable=False, comment="原始文件名")
    file_type = Column(String(50), nullable=True, comment="文件类型(image, mask, etc)")
    file_size = Column(Integer, nullable=True, comment="文件大小(字节)")
    mime_type = Column(String(100), nullable=True, comment="MIME类型")
    
    # 存储配置
    storage_type = Column(String(20), default="local", comment="存储类型: local, s3, oss")
    upload_ip = Column(String(45), nullable=True, comment="上传IP地址")
    
    # 生命周期管理
    is_temporary = Column(Boolean, default=False, comment="是否为临时文件")
    expires_at = Column(DateTime(timezone=True), nullable=True, comment="过期时间")
    
    # 关联关系
    user = relationship("User", back_populates="file_storage")
    
    def __repr__(self):
        return f"<FileStorage(id={self.id}, file_name={self.file_name}, file_type={self.file_type})>"
    
    @property
    def is_expired(self) -> bool:
        """检查文件是否已过期"""
        if not self.expires_at:
            return False
        
        from datetime import datetime
        return datetime.utcnow() > self.expires_at
    
    @property
    def file_size_mb(self) -> float:
        """获取文件大小(MB)"""
        if self.file_size:
            return round(self.file_size / (1024 * 1024), 2)
        return 0.0
    
    @property
    def is_image(self) -> bool:
        """是否为图像文件"""
        if self.mime_type:
            return self.mime_type.startswith('image/')
        return self.file_type == 'image'
    
    def mark_as_expired(self, db_session=None):
        """标记文件为已过期"""
        from datetime import datetime
        self.expires_at = datetime.utcnow()
        if db_session:
            db_session.commit()
    
    def extend_expiry(self, hours: int = 24, db_session=None):
        """延长文件过期时间"""
        from datetime import datetime, timedelta
        self.expires_at = datetime.utcnow() + timedelta(hours=hours)
        if db_session:
            db_session.commit() 