from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.sqlite import JSON

from ..base import BaseModel

class ProcessRecord(BaseModel):
    """处理记录表模型"""
    __tablename__ = "process_records"
    
    # 关联用户
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    
    # 任务标识
    task_id = Column(String(100), unique=True, nullable=True, index=True, comment="任务唯一标识")
    
    # 图像信息
    original_image_url = Column(String(500), nullable=False, comment="原始图片URL")
    original_image_size = Column(Integer, nullable=True, comment="原始图片大小(字节)")
    result_image_url = Column(String(500), nullable=True, comment="处理结果图片URL")
    result_image_size = Column(Integer, nullable=True, comment="结果图片大小(字节)")
    
    # 处理参数
    mask_data = Column(Text, nullable=True, comment="蒙版数据(base64或路径)")
    model_name = Column(String(50), nullable=False, comment="使用的模型名称")
    model_config = Column(JSON, nullable=True, comment="模型配置参数")
    
    # 处理状态
    status = Column(String(20), default="pending", comment="处理状态: pending, processing, completed, failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
    progress = Column(Integer, default=0, comment="处理进度(0-100)")
    
    # 时间统计
    processing_time = Column(Integer, nullable=True, comment="处理时间(秒)")
    started_at = Column(DateTime(timezone=True), nullable=True, comment="开始处理时间")
    completed_at = Column(DateTime(timezone=True), nullable=True, comment="完成时间")
    
    # 关联关系
    user = relationship("User", back_populates="process_records")
    
    def __repr__(self):
        return f"<ProcessRecord(id={self.id}, user_id={self.user_id}, status={self.status})>"
    
    @property
    def is_processing(self) -> bool:
        """是否正在处理中"""
        return self.status in ["pending", "processing"]
    
    @property
    def is_completed(self) -> bool:
        """是否已完成"""
        return self.status == "completed"
    
    @property
    def is_failed(self) -> bool:
        """是否处理失败"""
        return self.status == "failed"
    
    @property
    def duration_seconds(self) -> int:
        """处理持续时间(秒)"""
        if self.started_at and self.completed_at:
            delta = self.completed_at - self.started_at
            return int(delta.total_seconds())
        return 0
    
    def update_progress(self, progress: int, db_session=None):
        """更新处理进度"""
        self.progress = max(0, min(100, progress))
        if db_session:
            db_session.commit()
    
    def mark_as_started(self, db_session=None):
        """标记为开始处理"""
        from datetime import datetime
        self.status = "processing"
        self.started_at = datetime.utcnow()
        self.progress = 0
        if db_session:
            db_session.commit()
    
    def mark_as_completed(self, result_url: str, db_session=None):
        """标记为处理完成"""
        from datetime import datetime
        self.status = "completed"
        self.result_image_url = result_url
        self.completed_at = datetime.utcnow()
        self.progress = 100
        if self.started_at:
            delta = self.completed_at - self.started_at
            self.processing_time = int(delta.total_seconds())
        if db_session:
            db_session.commit()
    
    def mark_as_failed(self, error_message: str, db_session=None):
        """标记为处理失败"""
        from datetime import datetime
        self.status = "failed"
        self.error_message = error_message
        self.completed_at = datetime.utcnow()
        if db_session:
            db_session.commit() 