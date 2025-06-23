from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ..database.models.process_record import ProcessRecord
from ..database.models.user import User

class ProcessRecordCRUD:
    """处理记录CRUD操作类"""
    
    def get_by_id(self, db: Session, record_id: int) -> Optional[ProcessRecord]:
        """根据ID获取处理记录"""
        return db.query(ProcessRecord).filter(ProcessRecord.id == record_id).first()
    
    def get_by_task_id(self, db: Session, task_id: str) -> Optional[ProcessRecord]:
        """根据任务ID获取处理记录"""
        return db.query(ProcessRecord).filter(ProcessRecord.task_id == task_id).first()
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[ProcessRecord]:
        """获取用户的处理记录"""
        return db.query(ProcessRecord).filter(ProcessRecord.user_id == user_id)\
                 .order_by(ProcessRecord.created_at.desc())\
                 .offset(skip).limit(limit).all()
    
    def create(self, db: Session, user_id: int, original_image_url: str, model_name: str, **kwargs) -> ProcessRecord:
        """创建新的处理记录"""
        import uuid
        
        record = ProcessRecord(
            user_id=user_id,
            task_id=str(uuid.uuid4()),
            original_image_url=original_image_url,
            model_name=model_name,
            **kwargs
        )
        
        db.add(record)
        db.commit()
        db.refresh(record)
        return record
    
    def update_status(self, db: Session, record_id: int, status: str, **kwargs) -> Optional[ProcessRecord]:
        """更新处理状态"""
        record = self.get_by_id(db, record_id)
        if not record:
            return None
        
        record.status = status
        for key, value in kwargs.items():
            if hasattr(record, key):
                setattr(record, key, value)
        
        if status == "processing" and not record.started_at:
            record.started_at = datetime.utcnow()
        elif status in ["completed", "failed"] and not record.completed_at:
            record.completed_at = datetime.utcnow()
            if record.started_at:
                delta = record.completed_at - record.started_at
                record.processing_time = int(delta.total_seconds())
        
        db.commit()
        db.refresh(record)
        return record
    
    def get_processing_records(self, db: Session) -> List[ProcessRecord]:
        """获取正在处理中的记录"""
        return db.query(ProcessRecord).filter(
            ProcessRecord.status.in_(["pending", "processing"])
        ).all()
    
    def get_user_stats(self, db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
        """获取用户处理统计"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # 基础统计
        total_count = db.query(ProcessRecord).filter(ProcessRecord.user_id == user_id).count()
        recent_count = db.query(ProcessRecord).filter(
            and_(ProcessRecord.user_id == user_id, ProcessRecord.created_at >= start_date)
        ).count()
        
        # 成功率统计
        completed_count = db.query(ProcessRecord).filter(
            and_(ProcessRecord.user_id == user_id, ProcessRecord.status == "completed")
        ).count()
        
        success_rate = completed_count / total_count if total_count > 0 else 0
        
        # 平均处理时间
        avg_time = db.query(func.avg(ProcessRecord.processing_time)).filter(
            and_(
                ProcessRecord.user_id == user_id,
                ProcessRecord.status == "completed",
                ProcessRecord.processing_time.isnot(None)
            )
        ).scalar() or 0
        
        # 今日使用次数
        today = datetime.utcnow().date()
        today_count = db.query(ProcessRecord).filter(
            and_(
                ProcessRecord.user_id == user_id,
                func.date(ProcessRecord.created_at) == today
            )
        ).count()
        
        return {
            "user_id": user_id,
            "total_processes": total_count,
            "recent_processes": recent_count,
            "completed_processes": completed_count,
            "success_rate": round(success_rate, 3),
            "avg_processing_time": round(float(avg_time), 2),
            "today_usage": today_count
        }
    
    def get_system_stats(self, db: Session, days: int = 7) -> Dict[str, Any]:
        """获取系统处理统计"""
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # 总体统计
        total_count = db.query(ProcessRecord).filter(ProcessRecord.created_at >= start_date).count()
        completed_count = db.query(ProcessRecord).filter(
            and_(ProcessRecord.created_at >= start_date, ProcessRecord.status == "completed")
        ).count()
        failed_count = db.query(ProcessRecord).filter(
            and_(ProcessRecord.created_at >= start_date, ProcessRecord.status == "failed")
        ).count()
        
        # 按模型统计
        model_stats = db.query(
            ProcessRecord.model_name, 
            func.count(ProcessRecord.id).label('count')
        ).filter(ProcessRecord.created_at >= start_date)\
         .group_by(ProcessRecord.model_name).all()
        
        # 平均处理时间
        avg_time = db.query(func.avg(ProcessRecord.processing_time)).filter(
            and_(
                ProcessRecord.created_at >= start_date,
                ProcessRecord.status == "completed",
                ProcessRecord.processing_time.isnot(None)
            )
        ).scalar() or 0
        
        return {
            "period_days": days,
            "total_processes": total_count,
            "completed_processes": completed_count,
            "failed_processes": failed_count,
            "success_rate": round(completed_count / total_count, 3) if total_count > 0 else 0,
            "avg_processing_time": round(float(avg_time), 2),
            "model_usage": {model: count for model, count in model_stats}
        }
    
    def cleanup_old_records(self, db: Session, days: int = 30) -> int:
        """清理旧的处理记录"""
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        deleted_count = db.query(ProcessRecord).filter(
            and_(
                ProcessRecord.created_at < cutoff_date,
                ProcessRecord.status.in_(["completed", "failed"])
            )
        ).delete()
        
        db.commit()
        return deleted_count
    
    def get_pending_records(self, db: Session, limit: int = 10) -> List[ProcessRecord]:
        """获取待处理的记录"""
        return db.query(ProcessRecord).filter(ProcessRecord.status == "pending")\
                 .order_by(ProcessRecord.created_at.asc())\
                 .limit(limit).all()
    
    def get_user_recent_records(self, db: Session, user_id: int, limit: int = 6) -> List[ProcessRecord]:
        """获取用户最近的处理记录"""
        return db.query(ProcessRecord).filter(ProcessRecord.user_id == user_id)\
                 .order_by(ProcessRecord.created_at.desc())\
                 .limit(limit).all()
    
    def get_user_record_count(self, db: Session, user_id: int, status: str = "") -> int:
        """获取用户的处理记录总数"""
        query = db.query(ProcessRecord).filter(ProcessRecord.user_id == user_id)
        if status and status != "all":
            query = query.filter(ProcessRecord.status == status)
        return query.count()
    
    def get_user_today_count(self, db: Session, user_id: int) -> int:
        """获取用户今日的处理记录数"""
        today = datetime.utcnow().date()
        return db.query(ProcessRecord).filter(
            and_(
                ProcessRecord.user_id == user_id,
                func.date(ProcessRecord.created_at) == today
            )
        ).count()
    
    def get_user_records_paginated(self, db: Session, user_id: int, page: int = 1, limit: int = 20, status: str = "") -> List[ProcessRecord]:
        """分页获取用户的处理记录"""
        skip = (page - 1) * limit
        query = db.query(ProcessRecord).filter(ProcessRecord.user_id == user_id)
        if status and status != "all":
            query = query.filter(ProcessRecord.status == status)
        return query.order_by(ProcessRecord.created_at.desc())\
                    .offset(skip).limit(limit).all()
    
    def get_user_record(self, db: Session, user_id: int, record_id: int) -> Optional[ProcessRecord]:
        """获取用户的特定处理记录"""
        return db.query(ProcessRecord).filter(
            and_(ProcessRecord.user_id == user_id, ProcessRecord.id == record_id)
        ).first()
    
    def delete_record(self, db: Session, record_id: int) -> bool:
        """删除处理记录"""
        record = self.get_by_id(db, record_id)
        if record:
            db.delete(record)
            db.commit()
            return True
        return False

# 全局处理记录CRUD实例
process_record_crud = ProcessRecordCRUD() 