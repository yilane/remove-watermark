#!/usr/bin/env python3
"""
IOPaint 微信小程序后端启动脚本 (带认证系统)
使用方法: python scripts/run_with_auth.py
"""

import os
import sys
import uvicorn
from pathlib import Path

# 添加项目根目录到Python路径
PROJECT_ROOT = Path(__file__).parent.parent
sys.path.insert(0, str(PROJECT_ROOT))

def load_env_file(env_file: str = "config.env"):
    """加载环境变量文件"""
    env_path = PROJECT_ROOT / env_file
    if env_path.exists():
        print(f"📝 加载环境变量文件: {env_path}")
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith('#') and '=' in line:
                    key, value = line.split('=', 1)
                    os.environ[key.strip()] = value.strip()
    else:
        print(f"⚠️ 环境变量文件不存在: {env_path}")

def main():
    """主函数"""
    print("🚀 IOPaint 微信小程序后端服务")
    print("=" * 50)
    
    # 加载环境变量
    load_env_file()
    
    # 获取配置
    host = os.getenv("HOST", "0.0.0.0")
    port = int(os.getenv("PORT", "8080"))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    workers = int(os.getenv("WORKERS", "1"))
    
    print(f"🌐 主机地址: {host}")
    print(f"🔌 端口号: {port}")
    print(f"🔍 调试模式: {debug}")
    print(f"👥 工作进程数: {workers}")
    print(f"📊 数据库: {os.getenv('DATABASE_URL', 'SQLite')}")
    print("-" * 50)
    
    try:
        # 导入应用
        from iopaint.api import Api
        from iopaint.schema import ApiConfig
        from fastapi import FastAPI
        
        # 创建FastAPI应用
        app = FastAPI(
            title="IOPaint 微信小程序 API",
            description="AI图像修复小程序后端服务",
            version="1.0.0",
            docs_url="/docs" if debug else None,
            redoc_url="/redoc" if debug else None
        )
        
        # 创建API配置
        config = ApiConfig(
            model="lama",  # 默认模型
            device="cpu",  # 设备类型
            port=port,
            host=host,
            debug=debug
        )
        
        # 初始化API
        api = Api(app, config)
        
        print("✅ 应用初始化完成")
        print(f"🌍 访问地址: http://{host}:{port}")
        if debug:
            print(f"📚 API文档: http://{host}:{port}/docs")
        print("=" * 50)
        
        # 启动服务
        uvicorn.run(
            app,
            host=host,
            port=port,
            workers=workers if not debug else 1,
            reload=debug,
            log_level="debug" if debug else "info"
        )
        
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 