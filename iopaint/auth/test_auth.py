#!/usr/bin/env python3
"""
认证系统测试脚本
用于验证JWT、数据库连接、微信认证等功能
"""

import os
import sys
import asyncio
from datetime import datetime

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "../.."))

def test_jwt_functions():
    """测试JWT相关功能"""
    print("🔐 测试JWT功能...")
    
    from iopaint.auth.jwt_handler import create_user_token, verify_token, get_user_id_from_token
    
    # 测试创建token
    user_id = 123
    openid = "test_openid_123"
    token = create_user_token(user_id, openid)
    print(f"✅ 创建Token成功: {token[:50]}...")
    
    # 测试验证token
    payload = verify_token(token)
    assert payload is not None, "Token验证失败"
    print(f"✅ Token验证成功: {payload}")
    
    # 测试提取用户ID
    extracted_user_id = get_user_id_from_token(token)
    assert extracted_user_id == str(user_id), f"用户ID不匹配: {extracted_user_id} != {user_id}"
    print(f"✅ 用户ID提取成功: {extracted_user_id}")

def test_database_connection():
    """测试数据库连接"""
    print("\n🗄️ 测试数据库连接...")
    
    from iopaint.database.connection import create_tables, get_db, engine
    from iopaint.database.models import User, ProcessRecord
    from sqlalchemy import text
    
    # 创建数据表
    create_tables()
    print("✅ 数据表创建成功")
    
    # 测试数据库连接
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        assert result.fetchone()[0] == 1
    print("✅ 数据库连接测试成功")
    
    # 测试数据库会话
    db_gen = get_db()
    db = next(db_gen)
    try:
        # 查询用户表
        users = db.query(User).all()
        print(f"✅ 用户表查询成功，当前用户数: {len(users)}")
    finally:
        db.close()

def test_user_crud():
    """测试用户CRUD操作"""
    print("\n👤 测试用户CRUD操作...")
    
    from iopaint.crud.user import user_crud
    from iopaint.schemas.auth import UserProfileCreate
    from iopaint.database.connection import get_db
    
    db_gen = get_db()
    db = next(db_gen)
    
    try:
        # 创建测试用户
        test_openid = f"test_openid_{int(datetime.now().timestamp())}"
        user_data = UserProfileCreate(
            openid=test_openid,
            nickname="测试用户",
            avatar_url="https://example.com/avatar.jpg"
        )
        
        user = user_crud.create(db, user_data)
        print(f"✅ 创建用户成功: ID={user.id}, OpenID={user.openid}")
        
        # 根据OpenID查找用户
        found_user = user_crud.get_by_openid(db, test_openid)
        assert found_user is not None, "根据OpenID查找用户失败"
        assert found_user.id == user.id, "查找到的用户ID不匹配"
        print(f"✅ 根据OpenID查找用户成功")
        
        # 更新用户信息
        from iopaint.schemas.auth import UserProfileUpdate
        update_data = UserProfileUpdate(nickname="更新后的昵称")
        updated_user = user_crud.update(db, user.id, update_data)
        assert updated_user.nickname == "更新后的昵称", "用户信息更新失败"
        print(f"✅ 更新用户信息成功")
        
        # 更新登录信息
        login_updated_user = user_crud.update_login_info(db, user.id)
        assert login_updated_user.login_count == 2, "登录次数更新失败"  # 创建时已经是1次
        print(f"✅ 更新登录信息成功")
        
        # 获取用户统计
        stats = user_crud.get_user_stats(db, user.id)
        assert "user_id" in stats, "用户统计信息获取失败"
        print(f"✅ 获取用户统计成功: {stats}")
        
    finally:
        db.close()

async def test_wechat_client():
    """测试微信客户端（模拟测试）"""
    print("\n🧧 测试微信客户端...")
    
    from iopaint.auth.wechat_auth import wechat_client
    
    # 测试无效code的处理
    result = await wechat_client.code_to_session("invalid_code_test")
    
    if "error" in result:
        print(f"✅ 无效code处理正确: {result['error']}")
    else:
        print("⚠️ 微信API可能可用，但建议在实际环境中测试")
    
    # 测试签名验证功能
    test_data = "test_raw_data"
    test_signature = "test_signature"
    test_session_key = "test_session_key"
    
    # 这个测试预期会失败，因为签名不匹配
    is_valid = wechat_client.validate_signature(test_data, test_signature, test_session_key)
    assert not is_valid, "签名验证应该失败"
    print("✅ 签名验证功能正常")

def test_auth_middleware():
    """测试认证中间件"""
    print("\n🛡️ 测试认证中间件...")
    
    from iopaint.auth.middleware import AuthenticationError
    
    # 测试异常类
    try:
        raise AuthenticationError("测试认证异常")
    except AuthenticationError as e:
        assert e.status_code == 401, "认证异常状态码错误"
        print("✅ 认证异常类正常")

async def main():
    """主测试函数"""
    print("🚀 开始IOPaint认证系统测试")
    print("=" * 50)
    
    try:
        # 测试JWT功能
        test_jwt_functions()
        
        # 测试数据库连接
        test_database_connection()
        
        # 测试用户CRUD
        test_user_crud()
        
        # 测试微信客户端
        await test_wechat_client()
        
        # 测试认证中间件
        test_auth_middleware()
        
        print("\n" + "=" * 50)
        print("🎉 所有测试通过！认证系统运行正常")
        
    except Exception as e:
        print(f"\n❌ 测试失败: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    # 设置测试环境变量
    os.environ.setdefault("SECRET_KEY", "test-secret-key-for-testing")
    os.environ.setdefault("DATABASE_URL", "sqlite:///./test_iopaint.db")
    
    # 运行测试
    success = asyncio.run(main())
    
    if success:
        print("\n✅ 认证系统测试完成，可以继续下一步任务")
    else:
        print("\n❌ 认证系统测试失败，请检查配置")
        sys.exit(1) 