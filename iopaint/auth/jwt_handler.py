from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
import os

# JWT配置
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-here-change-this-in-production")
ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("JWT_EXPIRATION_TIME", "1440"))  # 24小时

# 密码上下文
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    创建JWT访问令牌
    
    Args:
        data: 要编码的数据字典
        expires_delta: 过期时间增量
        
    Returns:
        JWT令牌字符串
    """
    to_encode = data.copy()
    
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire, "iat": datetime.utcnow()})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    验证JWT令牌
    
    Args:
        token: JWT令牌字符串
        
    Returns:
        解码后的载荷数据，验证失败返回None
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError as e:
        print(f"JWT验证失败: {e}")
        return None

def get_user_id_from_token(token: str) -> Optional[str]:
    """
    从JWT令牌中提取用户ID
    
    Args:
        token: JWT令牌字符串
        
    Returns:
        用户ID，提取失败返回None
    """
    payload = verify_token(token)
    if payload:
        return payload.get("sub")
    return None

def hash_password(password: str) -> str:
    """
    哈希密码
    
    Args:
        password: 明文密码
        
    Returns:
        哈希后的密码
    """
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    验证密码
    
    Args:
        plain_password: 明文密码
        hashed_password: 哈希密码
        
    Returns:
        验证结果
    """
    return pwd_context.verify(plain_password, hashed_password)

def create_user_token(user_id: int, openid: str) -> str:
    """
    为用户创建令牌
    
    Args:
        user_id: 用户ID
        openid: 微信OpenID
        
    Returns:
        JWT令牌
    """
    token_data = {
        "sub": str(user_id),
        "openid": openid,
        "type": "access_token"
    }
    return create_access_token(token_data) 