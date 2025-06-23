#!/usr/bin/env python3
"""
数据库功能测试脚本
测试所有数据库模型和CRUD操作
"""

import os
import sys
import asyncio
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(__file__))))

from iopaint.database.connection import (
    SessionLocal, create_tables, drop_tables, init_default_configs, 
    check_database_connection, get_database_info
)
from iopaint.database.models import User, ProcessRecord, FileStorage, UserSession, SystemConfig
from iopaint.crud.user import user_crud
from iopaint.crud.process_record import process_record_crud
from iopaint.crud.file_storage import file_storage_crud

def test_database_connection():
    """测试数据库连接"""
    print("=== 测试数据库连接 ===")
    success = check_database_connection()
    if success:
        info = get_database_info()
        print(f"数据库类型: {'SQLite' if info['is_sqlite'] else 'PostgreSQL/MySQL'}")
        print(f"数据库URL: {info['database_url']}")
        print(f"连接池大小: {info['pool_size']}")
    return success

def test_user_operations():
    """测试用户操作"""
    print("\n=== 测试用户CRUD操作 ===")
    db = SessionLocal()
    
    try:
        # 创建测试用户
        test_user = user_crud.create(db, {
            "openid": "test_openid_123",
            "nickname": "测试用户",
            "avatar_url": "https://example.com/avatar.jpg"
        })
        print(f"✅ 创建用户成功: {test_user}")
        
        # 根据openid查找用户
        found_user = user_crud.get_by_openid(db, "test_openid_123")
        print(f"✅ 查找用户成功: {found_user.nickname}")
        
        # 更新用户信息
        updated_user = user_crud.update(db, found_user, {
            "nickname": "更新后的用户名",
            "phone": "13800138000"
        })
        print(f"✅ 更新用户成功: {updated_user.nickname}")
        
        # 更新登录信息
        user_crud.update_login_info(db, updated_user)
        print(f"✅ 更新登录信息成功: 登录次数 {updated_user.login_count}")
        
        # 获取用户统计
        stats = user_crud.get_user_stats(db, updated_user.id)
        print(f"✅ 用户统计: {stats}")
        
        return updated_user.id
        
    except Exception as e:
        print(f"❌ 用户操作测试失败: {e}")
        return None
    finally:
        db.close()

def test_process_record_operations(user_id: int):
    """测试处理记录操作"""
    print("\n=== 测试处理记录CRUD操作 ===")
    db = SessionLocal()
    
    try:
        # 创建处理记录
        record = process_record_crud.create(
            db=db,
            user_id=user_id,
            original_image_url="/uploads/test_image.jpg",
            model_name="lama",
            model_config={"strength": 0.8}
        )
        print(f"✅ 创建处理记录成功: Task ID {record.task_id}")
        
        # 更新状态为处理中
        updated_record = process_record_crud.update_status(
            db, record.id, "processing"
        )
        print(f"✅ 更新状态成功: {updated_record.status}")
        
        # 模拟处理完成
        completed_record = process_record_crud.update_status(
            db, record.id, "completed", 
            result_image_url="/results/test_result.jpg"
        )
        print(f"✅ 标记完成成功: {completed_record.status}")
        
        # 获取用户处理记录
        user_records = process_record_crud.get_by_user(db, user_id)
        print(f"✅ 获取用户记录: {len(user_records)} 条记录")
        
        # 获取用户统计
        user_stats = process_record_crud.get_user_stats(db, user_id)
        print(f"✅ 用户处理统计: {user_stats}")
        
        return record.id
        
    except Exception as e:
        print(f"❌ 处理记录操作测试失败: {e}")
        return None
    finally:
        db.close()

def test_file_storage_operations(user_id: int):
    """测试文件存储操作"""
    print("\n=== 测试文件存储CRUD操作 ===")
    db = SessionLocal()
    
    try:
        # 创建文件记录
        file_record = file_storage_crud.create(
            db=db,
            user_id=user_id,
            file_path="/uploads/test_file.jpg",
            file_name="test_file.jpg",
            file_type="image",
            file_size=1024000,
            mime_type="image/jpeg"
        )
        print(f"✅ 创建文件记录成功: {file_record.file_name}")
        
        # 创建临时文件
        temp_file = file_storage_crud.create(
            db=db,
            user_id=user_id,
            file_path="/temp/temp_file.jpg",
            file_name="temp_file.jpg",
            file_type="image",
            is_temporary=True,
            expires_at=datetime.utcnow() + timedelta(hours=1)
        )
        print(f"✅ 创建临时文件成功: {temp_file.file_name}")
        
        # 获取用户文件
        user_files = file_storage_crud.get_by_user(db, user_id)
        print(f"✅ 获取用户文件: {len(user_files)} 个文件")
        
        # 获取存储统计
        storage_stats = file_storage_crud.get_storage_stats(db, user_id)
        print(f"✅ 存储统计: {storage_stats}")
        
        return file_record.id
        
    except Exception as e:
        print(f"❌ 文件存储操作测试失败: {e}")
        return None
    finally:
        db.close()

def test_system_config_operations():
    """测试系统配置操作"""
    print("\n=== 测试系统配置操作 ===")
    db = SessionLocal()
    
    try:
        # 设置配置
        config = SystemConfig.set_config(
            db, "test_config", "test_value", "string", "测试配置项"
        )
        print(f"✅ 设置配置成功: {config.config_key} = {config.config_value}")
        
        # 获取配置
        value = SystemConfig.get_config(db, "test_config")
        print(f"✅ 获取配置成功: {value}")
        
        # 设置JSON配置
        json_config = SystemConfig.set_config(
            db, "json_test", {"key": "value", "number": 123}, "json", "JSON测试"
        )
        print(f"✅ 设置JSON配置成功: {json_config.typed_value}")
        
        return True
        
    except Exception as e:
        print(f"❌ 系统配置操作测试失败: {e}")
        return False
    finally:
        db.close()

def test_relationships():
    """测试模型关系"""
    print("\n=== 测试模型关系 ===")
    db = SessionLocal()
    
    try:
        # 获取用户及其相关数据
        user = db.query(User).filter(User.openid == "test_openid_123").first()
        if user:
            print(f"✅ 用户: {user.nickname}")
            print(f"  - 处理记录数: {len(user.process_records)}")
            print(f"  - 文件数: {len(user.file_storage)}")
            print(f"  - 会话数: {len(user.sessions)}")
            
            # 测试用户配额检查
            print(f"  - 是否超出配额: {user.is_quota_exceeded}")
            print(f"  - 今日使用次数: {user.today_usage_count}")
            
            return True
        else:
            print("❌ 未找到测试用户")
            return False
            
    except Exception as e:
        print(f"❌ 关系测试失败: {e}")
        return False
    finally:
        db.close()

def cleanup_test_data():
    """清理测试数据"""
    print("\n=== 清理测试数据 ===")
    db = SessionLocal()
    
    try:
        # 删除测试用户（会级联删除相关数据）
        test_user = db.query(User).filter(User.openid == "test_openid_123").first()
        if test_user:
            db.delete(test_user)
        
        # 删除测试配置
        test_configs = db.query(SystemConfig).filter(
            SystemConfig.config_key.in_(["test_config", "json_test"])
        ).all()
        for config in test_configs:
            db.delete(config)
        
        db.commit()
        print("✅ 测试数据清理完成")
        
    except Exception as e:
        print(f"❌ 清理测试数据失败: {e}")
    finally:
        db.close()

def main():
    """主测试函数"""
    print("🚀 开始数据库功能测试...")
    
    # 测试数据库连接
    if not test_database_connection():
        print("❌ 数据库连接失败，终止测试")
        return
    
    # 初始化默认配置
    try:
        init_default_configs()
    except Exception as e:
        print(f"⚠️ 初始化默认配置失败: {e}")
    
    # 执行各项测试
    user_id = test_user_operations()
    if user_id:
        process_record_id = test_process_record_operations(user_id)
        file_id = test_file_storage_operations(user_id)
        test_system_config_operations()
        test_relationships()
    
    # 清理测试数据
    cleanup_test_data()
    
    print("\n🎉 数据库功能测试完成！")

if __name__ == "__main__":
    main() 