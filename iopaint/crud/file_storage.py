from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ..database.models.file_storage import FileStorage

class FileStorageCRUD:
    """文件存储CRUD操作类"""
    
    def get_by_id(self, db: Session, file_id: int) -> Optional[FileStorage]:
        """根据ID获取文件记录"""
        return db.query(FileStorage).filter(FileStorage.id == file_id).first()
    
    def get_by_path(self, db: Session, file_path: str) -> Optional[FileStorage]:
        """根据文件路径获取文件记录"""
        return db.query(FileStorage).filter(FileStorage.file_path == file_path).first()
    
    def get_by_user(self, db: Session, user_id: int, skip: int = 0, limit: int = 50) -> List[FileStorage]:
        """获取用户的文件列表"""
        return db.query(FileStorage).filter(FileStorage.user_id == user_id)\
                 .order_by(FileStorage.created_at.desc())\
                 .offset(skip).limit(limit).all()
    
    def create(self, db: Session, file_path: str, file_name: str, **kwargs) -> FileStorage:
        """创建新的文件记录"""
        file_record = FileStorage(
            file_path=file_path,
            file_name=file_name,
            **kwargs
        )
        
        db.add(file_record)
        db.commit()
        db.refresh(file_record)
        return file_record
    
    def update(self, db: Session, file_id: int, **kwargs) -> Optional[FileStorage]:
        """更新文件记录"""
        file_record = self.get_by_id(db, file_id)
        if not file_record:
            return None
        
        for key, value in kwargs.items():
            if hasattr(file_record, key):
                setattr(file_record, key, value)
        
        db.commit()
        db.refresh(file_record)
        return file_record
    
    def delete(self, db: Session, file_id: int) -> bool:
        """删除文件记录"""
        file_record = self.get_by_id(db, file_id)
        if not file_record:
            return False
        
        db.delete(file_record)
        db.commit()
        return True
    
    def get_expired_files(self, db: Session) -> List[FileStorage]:
        """获取已过期的文件"""
        now = datetime.utcnow()
        return db.query(FileStorage).filter(
            and_(
                FileStorage.expires_at.isnot(None),
                FileStorage.expires_at <= now
            )
        ).all()
    
    def get_temporary_files(self, db: Session, older_than_hours: int = 24) -> List[FileStorage]:
        """获取需要清理的临时文件"""
        cutoff_time = datetime.utcnow() - timedelta(hours=older_than_hours)
        return db.query(FileStorage).filter(
            and_(
                FileStorage.is_temporary == True,
                FileStorage.created_at <= cutoff_time
            )
        ).all()
    
    def cleanup_expired_files(self, db: Session) -> int:
        """清理过期文件"""
        expired_files = self.get_expired_files(db)
        count = 0
        
        for file_record in expired_files:
            # 这里可以添加实际删除文件的逻辑
            # os.remove(file_record.file_path) 
            db.delete(file_record)
            count += 1
        
        db.commit()
        return count
    
    def cleanup_temporary_files(self, db: Session, older_than_hours: int = 24) -> int:
        """清理临时文件"""
        temp_files = self.get_temporary_files(db, older_than_hours)
        count = 0
        
        for file_record in temp_files:
            # 这里可以添加实际删除文件的逻辑
            # os.remove(file_record.file_path)
            db.delete(file_record)
            count += 1
        
        db.commit()
        return count
    
    def get_storage_stats(self, db: Session, user_id: Optional[int] = None) -> Dict[str, Any]:
        """获取存储统计信息"""
        query = db.query(FileStorage)
        if user_id:
            query = query.filter(FileStorage.user_id == user_id)
        
        files = query.all()
        
        total_files = len(files)
        total_size = sum(f.file_size or 0 for f in files)
        image_files = len([f for f in files if f.is_image])
        temporary_files = len([f for f in files if f.is_temporary])
        expired_files = len([f for f in files if f.is_expired])
        
        # 按存储类型统计
        storage_types = {}
        for file_record in files:
            storage_type = file_record.storage_type
            if storage_type not in storage_types:
                storage_types[storage_type] = {"count": 0, "size": 0}
            storage_types[storage_type]["count"] += 1
            storage_types[storage_type]["size"] += file_record.file_size or 0
        
        return {
            "user_id": user_id,
            "total_files": total_files,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "image_files": image_files,
            "temporary_files": temporary_files,
            "expired_files": expired_files,
            "storage_types": storage_types
        }
    
    def extend_file_expiry(self, db: Session, file_id: int, hours: int = 24) -> Optional[FileStorage]:
        """延长文件过期时间"""
        file_record = self.get_by_id(db, file_id)
        if not file_record:
            return None
        
        file_record.extend_expiry(hours, db)
        return file_record
    
    def mark_as_permanent(self, db: Session, file_id: int) -> Optional[FileStorage]:
        """将临时文件标记为永久文件"""
        file_record = self.get_by_id(db, file_id)
        if not file_record:
            return None
        
        file_record.is_temporary = False
        file_record.expires_at = None
        db.commit()
        db.refresh(file_record)
        return file_record

# 全局文件存储CRUD实例
file_storage_crud = FileStorageCRUD() 