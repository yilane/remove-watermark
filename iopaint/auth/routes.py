from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Dict, Any

from ..database.connection import get_db
from ..schemas.auth import (
    WeChatLoginRequest, 
    AuthResponse, 
    TokenResponse, 
    UserProfileResponse,
    UserProfileUpdate,
    ErrorResponse
)
from ..crud.user import user_crud
from .wechat_auth import wechat_client
from .jwt_handler import create_user_token, ACCESS_TOKEN_EXPIRE_MINUTES
from .middleware import get_current_active_user, get_current_user
from ..database.models import User

# 创建路由器
router = APIRouter(prefix="/api/v1/auth", tags=["认证"])

@router.post("/wechat-login", response_model=AuthResponse, summary="微信登录")
async def wechat_login(
    login_data: WeChatLoginRequest,
    db: Session = Depends(get_db)
):
    """
    微信小程序登录接口
    
    流程:
    1. 通过code获取openid和session_key
    2. 查找或创建用户
    3. 生成JWT token
    4. 返回用户信息和token
    """
    try:
        # 调用微信API获取session信息
        session_result = await wechat_client.code_to_session(login_data.code)
        
        if "error" in session_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=session_result
            )
        
        openid = session_result.get("openid")
        if not openid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={"error": "invalid_code", "error_description": "无效的登录凭证"}
            )
        
        # 查找现有用户
        existing_user = user_crud.get_by_openid(db, openid)
        is_new_user = False
        
        if existing_user:
            # 更新登录信息
            user = user_crud.update_login_info(db, existing_user.id)
        else:
            # 创建新用户
            user_data = {
                "openid": openid,
                "union_id": session_result.get("unionid"),
                "nickname": None,
                "avatar_url": None
            }
            
            # 处理用户信息（优先使用加密数据，回退到raw_data）
            if all([login_data.encrypted_data, login_data.iv, session_result.get("session_key")]):
                # 尝试解密用户信息
                user_info = await wechat_client.get_user_info(
                    session_result["session_key"],
                    login_data.encrypted_data,
                    login_data.iv
                )
                if user_info:
                    user_data.update({
                        "nickname": user_info.get("nickName"),
                        "avatar_url": user_info.get("avatarUrl")
                    })
            elif login_data.raw_data:
                # 处理原始数据
                try:
                    import json
                    raw_user_info = json.loads(login_data.raw_data)
                    user_data.update({
                        "nickname": raw_user_info.get("nickName"),
                        "avatar_url": raw_user_info.get("avatarUrl")
                    })
                except (json.JSONDecodeError, AttributeError):
                    print(f"解析raw_data失败: {login_data.raw_data}")
            
            from ..schemas.auth import UserProfileCreate
            user = user_crud.create(db, UserProfileCreate(**user_data))
            is_new_user = True
        
        # 生成JWT token
        access_token = create_user_token(user.id, user.openid)
        
        # 构造响应
        return AuthResponse(
            user=UserProfileResponse.model_validate(user),
            token=TokenResponse(
                access_token=access_token,
                token_type="bearer",
                expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
            ),
            is_new_user=is_new_user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"微信登录异常: {e}")
        print(f"详细错误: {error_details}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={"error": "login_failed", "error_description": f"登录失败: {str(e)}"}
        )

@router.get("/profile", response_model=UserProfileResponse, summary="获取用户资料")
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """获取当前用户的资料信息"""
    return UserProfileResponse.model_validate(current_user)

@router.put("/profile", response_model=UserProfileResponse, summary="更新用户资料")
async def update_user_profile(
    profile_data: UserProfileUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """更新当前用户的资料信息"""
    updated_user = user_crud.update(db, current_user.id, profile_data)
    if not updated_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户不存在"
        )
    return UserProfileResponse.model_validate(updated_user)

@router.get("/stats", summary="获取用户统计信息")
async def get_user_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """获取当前用户的统计信息"""
    stats = user_crud.get_user_stats(db, current_user.id)
    return stats

@router.post("/refresh", response_model=TokenResponse, summary="刷新Token")
async def refresh_token(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    刷新访问令牌
    注意：当前实现为简化版本，实际生产环境应使用refresh token机制
    """
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="无效的令牌"
        )
    
    # 更新用户登录信息
    user_crud.update_login_info(db, current_user.id)
    
    # 生成新的access token
    new_token = create_user_token(current_user.id, current_user.openid)
    
    return TokenResponse(
        access_token=new_token,
        token_type="bearer",
        expires_in=ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/logout", summary="用户登出")
async def logout(
    current_user: User = Depends(get_current_user)
):
    """
    用户登出
    注意：JWT是无状态的，实际的登出需要客户端删除token
    """
    return {"message": "登出成功"}

@router.get("/me", response_model=UserProfileResponse, summary="获取当前用户信息")
async def get_current_user_info(
    current_user: User = Depends(get_current_active_user)
):
    """获取当前登录用户的详细信息"""
    return UserProfileResponse.model_validate(current_user)

 