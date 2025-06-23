from sqlalchemy import Column, Integer, String, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    """用户表模型"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    openid = Column(String(255), unique=True, nullable=False, index=True, comment="微信OpenID")
    union_id = Column(String(255), nullable=True, index=True, comment="微信UnionID")
    nickname = Column(String(100), nullable=True, comment="用户昵称")
    avatar_url = Column(String(500), nullable=True, comment="头像URL")
    phone = Column(String(20), nullable=True, comment="手机号")
    email = Column(String(100), nullable=True, comment="邮箱")
    is_active = Column(Boolean, default=True, comment="是否激活")
    is_premium = Column(Boolean, default=False, comment="是否付费用户")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")
    last_login_at = Column(DateTime(timezone=True), nullable=True, comment="最后登录时间")
    login_count = Column(Integer, default=0, comment="登录次数")
    
    # 关联关系
    process_records = relationship("ProcessRecord", back_populates="user")

class ProcessRecord(Base):
    """处理记录表模型"""
    __tablename__ = "process_records"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True, comment="用户ID")
    original_image_url = Column(String(500), nullable=False, comment="原始图片URL")
    result_image_url = Column(String(500), nullable=True, comment="处理结果图片URL")
    mask_data = Column(Text, nullable=True, comment="蒙版数据")
    model_name = Column(String(50), nullable=False, comment="使用的模型名称")
    status = Column(String(20), default="pending", comment="处理状态: pending, processing, completed, failed")
    error_message = Column(Text, nullable=True, comment="错误信息")
    processing_time = Column(Integer, nullable=True, comment="处理时间(秒)")
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    completed_at = Column(DateTime(timezone=True), nullable=True, comment="完成时间")
    
    # 关联关系
    user = relationship("User", back_populates="process_records") 