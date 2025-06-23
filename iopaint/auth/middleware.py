from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional

from .jwt_handler import get_user_id_from_token
from ..database.connection import get_db
from ..database.models import User

# HTTP Bearer安全方案
security = HTTPBearer(auto_error=False)

class AuthenticationError(HTTPException):
    """认证错误异常"""
    def __init__(self, detail: str = "Could not validate credentials"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    """
    获取当前用户（可选）
    
    Args:
        credentials: HTTP Bearer凭证
        db: 数据库会话
        
    Returns:
        用户对象，未认证返回None
    """
    if not credentials:
        return None
    
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        return None
    
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        return user
    except (ValueError, Exception):
        return None

async def get_current_user_required(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """
    获取当前用户（必需）
    
    Args:
        credentials: HTTP Bearer凭证
        db: 数据库会话
        
    Returns:
        用户对象
        
    Raises:
        AuthenticationError: 认证失败
    """
    if not credentials:
        raise AuthenticationError("Missing authentication token")
    
    user_id = get_user_id_from_token(credentials.credentials)
    if not user_id:
        raise AuthenticationError("Invalid authentication token")
    
    try:
        user = db.query(User).filter(User.id == int(user_id)).first()
        if not user:
            raise AuthenticationError("User not found")
        return user
    except ValueError:
        raise AuthenticationError("Invalid token format")

async def get_current_active_user(
    current_user: User = Depends(get_current_user_required)
) -> User:
    """
    获取当前活跃用户
    
    Args:
        current_user: 当前用户
        
    Returns:
        活跃用户对象
        
    Raises:
        HTTPException: 用户未激活
    """
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user

def require_premium_user(current_user: User = Depends(get_current_active_user)) -> User:
    """
    要求付费用户权限
    
    Args:
        current_user: 当前用户
        
    Returns:
        付费用户对象
        
    Raises:
        HTTPException: 用户非付费用户
    """
    if not current_user.is_premium:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Premium subscription required"
        )
    return current_user 