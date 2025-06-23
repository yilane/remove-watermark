from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy import Column, Integer, DateTime
from sqlalchemy.sql import func

Base = declarative_base()

class TimestampMixin:
    """时间戳混入类，为模型提供创建和更新时间"""
    created_at = Column(DateTime(timezone=True), server_default=func.now(), comment="创建时间")
    updated_at = Column(DateTime(timezone=True), onupdate=func.now(), comment="更新时间")

class BaseModel(Base, TimestampMixin):
    """基础模型类，所有模型的基类"""
    __abstract__ = True
    
    id = Column(Integer, primary_key=True, index=True, comment="主键ID") 