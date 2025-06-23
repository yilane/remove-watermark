from sqlalchemy.orm import Session
from sqlalchemy import func, and_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta

from ..database.models.user import User
from ..schemas.auth import UserProfileCreate, UserProfileUpdate

class UserCRUD:
    """用户CRUD操作类"""
    
    def get_by_id(self, db: Session, user_id: int) -> Optional[User]:
        """根据ID获取用户"""
        return db.query(User).filter(User.id == user_id).first()
    
    def get_by_openid(self, db: Session, openid: str) -> Optional[User]:
        """根据OpenID获取用户"""
        return db.query(User).filter(User.openid == openid).first()
    
    def create(self, db: Session, user_data: UserProfileCreate) -> User:
        """创建新用户"""
        user = User(**user_data.model_dump())
        db.add(user)
        db.commit()
        db.refresh(user)
        return user
    
    def update(self, db: Session, user: User, user_data: Dict[str, Any]) -> User:
        """更新用户信息"""
        for key, value in user_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
        return user
    
    def update_login_info(self, db: Session, user_id: int) -> User:
        """更新登录信息"""
        user = self.get_by_id(db, user_id)
        if user:
            user.login_count += 1
            user.last_login_at = datetime.utcnow()
            db.commit()
            db.refresh(user)
        return user
    
    def get_user_stats(self, db: Session, user_id: int, days: int = 30) -> Dict[str, Any]:
        """获取用户统计信息"""
        user = self.get_by_id(db, user_id)
        if not user:
            return {}
        
        start_date = datetime.utcnow() - timedelta(days=days)
        
        # 基础统计
        total_processes = len(user.process_records)
        recent_processes = len([r for r in user.process_records if r.created_at >= start_date])
        completed_processes = len([r for r in user.process_records if r.status == "completed"])
        
        # 成功率
        success_rate = completed_processes / total_processes if total_processes > 0 else 0
        
        # 今日使用次数
        today_usage = user.today_usage_count
        
        return {
            "user_id": user_id,
            "total_processes": total_processes,
            "recent_processes": recent_processes,
            "completed_processes": completed_processes,
            "success_rate": round(success_rate, 3),
            "today_usage": today_usage,
            "quota_exceeded": user.is_quota_exceeded
        }
    
    def get_all_users(self, db: Session, skip: int = 0, limit: int = 100) -> List[User]:
        """获取所有用户"""
        return db.query(User).offset(skip).limit(limit).all()
    
    def deactivate_user(self, db: Session, user_id: int) -> Optional[User]:
        """停用用户"""
        user = self.get_by_id(db, user_id)
        if user:
            user.is_active = False
            db.commit()
            db.refresh(user)
        return user
    
    def activate_user(self, db: Session, user_id: int) -> Optional[User]:
        """激活用户"""
        user = self.get_by_id(db, user_id)
        if user:
            user.is_active = True
            db.commit()
            db.refresh(user)
        return user

# 全局用户CRUD实例
user_crud = UserCRUD() 