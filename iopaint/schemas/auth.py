from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class WeChatLoginRequest(BaseModel):
    """微信登录请求模型"""
    code: str = Field(..., description="微信小程序wx.login()返回的code")
    encrypted_data: Optional[str] = Field(None, description="加密的用户数据")
    iv: Optional[str] = Field(None, description="初始向量")
    signature: Optional[str] = Field(None, description="数据签名")
    raw_data: Optional[str] = Field(None, description="原始数据")

class TokenResponse(BaseModel):
    """Token响应模型"""
    access_token: str = Field(..., description="访问令牌")
    token_type: str = Field(default="bearer", description="令牌类型")
    expires_in: int = Field(..., description="过期时间(秒)")
    
class RefreshTokenRequest(BaseModel):
    """刷新Token请求模型"""
    refresh_token: str = Field(..., description="刷新令牌")

class UserProfileBase(BaseModel):
    """用户资料基础模型"""
    nickname: Optional[str] = Field(None, max_length=100, description="用户昵称")
    avatar_url: Optional[str] = Field(None, max_length=500, description="头像URL")
    phone: Optional[str] = Field(None, max_length=20, description="手机号")
    email: Optional[str] = Field(None, max_length=100, description="邮箱")

class UserProfileCreate(UserProfileBase):
    """创建用户资料模型"""
    openid: str = Field(..., max_length=255, description="微信OpenID")
    union_id: Optional[str] = Field(None, max_length=255, description="微信UnionID")

class UserProfileUpdate(UserProfileBase):
    """更新用户资料模型"""
    pass

class UserProfileResponse(UserProfileBase):
    """用户资料响应模型"""
    id: int = Field(..., description="用户ID")
    openid: str = Field(..., description="微信OpenID")
    is_active: bool = Field(..., description="是否激活")
    is_premium: bool = Field(..., description="是否付费用户")
    created_at: datetime = Field(..., description="创建时间")
    last_login_at: Optional[datetime] = Field(None, description="最后登录时间")
    login_count: int = Field(..., description="登录次数")
    
    class Config:
        from_attributes = True

class AuthResponse(BaseModel):
    """认证响应模型"""
    user: UserProfileResponse = Field(..., description="用户信息")
    token: TokenResponse = Field(..., description="令牌信息")
    is_new_user: bool = Field(..., description="是否为新用户")

class ErrorResponse(BaseModel):
    """错误响应模型"""
    error: str = Field(..., description="错误代码")
    error_description: str = Field(..., description="错误描述")
    details: Optional[dict] = Field(None, description="错误详情") 