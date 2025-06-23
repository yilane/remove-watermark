#!/usr/bin/env python3
"""
IOPaint 微信小程序数据库初始化脚本
使用方法: python scripts/init_database.py
"""

import os
import sys
from pathlib import Path

# 添加项目根目录到Python路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

from iopaint.database.connection import (
    create_tables, 
    check_database_connection, 
    init_default_configs,
    get_database_info
)
from iopaint.database.models import User, ProcessRecord, FileStorage, UserSession, SystemConfig

def main():
    """主函数"""
    print("🚀 IOPaint 微信小程序数据库初始化")
    print("=" * 50)
    
    # 显示数据库信息
    db_info = get_database_info()
    print(f"📊 数据库类型: {'SQLite' if db_info['is_sqlite'] else 'MySQL/PostgreSQL'}")
    print(f"📍 数据库URL: {db_info['database_url']}")
    print(f"🔍 调试模式: {db_info['echo']}")
    if not db_info['is_sqlite']:
        print(f"🔗 连接池大小: {db_info['pool_size']}")
    print("-" * 50)
    
    try:
        # 步骤1: 检查数据库连接
        print("1️⃣ 检查数据库连接...")
        if not check_database_connection():
            print("❌ 数据库连接失败！请检查配置。")
            return False
        print("✅ 数据库连接成功")
        
        # 步骤2: 创建数据表
        print("\n2️⃣ 创建数据表...")
        create_tables()
        print("✅ 数据表创建成功")
        
        # 显示创建的表
        models = [User, ProcessRecord, FileStorage, UserSession, SystemConfig]
        for model in models:
            print(f"   📋 {model.__tablename__}")
        
        # 步骤3: 初始化系统配置
        print("\n3️⃣ 初始化系统配置...")
        init_default_configs()
        print("✅ 系统配置初始化完成")
        
        print("\n🎉 数据库初始化完成！")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"❌ 数据库初始化失败: {e}")
        return False

if __name__ == "__main__":
    # 设置环境变量(如果需要)
    if not os.getenv("DATABASE_URL"):
        os.environ["DATABASE_URL"] = "sqlite:///./iopaint_miniprogram.db"
    
    success = main()
    sys.exit(0 if success else 1) 