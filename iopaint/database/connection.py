import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from .base import Base

class DatabaseConfig:
    """数据库配置类"""
    
    def __init__(self):
        self.database_url = os.getenv("DATABASE_URL", "sqlite:///./iopaint_miniprogram.db")
        self.echo = os.getenv("DB_ECHO", "false").lower() == "true"
        self.pool_size = int(os.getenv("DB_POOL_SIZE", "10"))
        self.max_overflow = int(os.getenv("DB_MAX_OVERFLOW", "20"))
        self.pool_timeout = int(os.getenv("DB_POOL_TIMEOUT", "30"))
        self.pool_recycle = int(os.getenv("DB_POOL_RECYCLE", "3600"))
    
    def get_engine_kwargs(self):
        """获取数据库引擎参数"""
        kwargs = {
            "echo": self.echo,
        }
        
        if self.database_url.startswith("sqlite"):
            # SQLite配置
            kwargs.update({
                "poolclass": StaticPool,
                "connect_args": {
                    "check_same_thread": False,
                    "timeout": 20
                }
            })
        else:
            # PostgreSQL/MySQL配置
            kwargs.update({
                "pool_size": self.pool_size,
                "max_overflow": self.max_overflow,
                "pool_timeout": self.pool_timeout,
                "pool_pre_ping": True,
                "pool_recycle": self.pool_recycle
            })
        
        return kwargs

# 创建数据库配置实例
config = DatabaseConfig()

# 创建数据库引擎
engine = create_engine(config.database_url, **config.get_engine_kwargs())

# 创建会话工厂
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    """获取数据库会话(依赖注入)"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def create_tables():
    """创建所有数据表"""
    # 导入所有模型确保它们被注册
    from .models import User, ProcessRecord, FileStorage, UserSession, SystemConfig
    
    Base.metadata.create_all(bind=engine)
    print("✅ 数据库表创建成功")

def drop_tables():
    """删除所有数据表 (仅用于开发环境)"""
    Base.metadata.drop_all(bind=engine)
    print("⚠️ 数据库表已删除")

def init_default_configs(db_session=None):
    """初始化默认系统配置"""
    from .models.system_config import SystemConfig
    
    if not db_session:
        db_session = SessionLocal()
        close_session = True
    else:
        close_session = False
    
    try:
        default_configs = [
            ("app_name", "IOPaint微信小程序", "string", "应用名称"),
            ("app_version", "1.0.0", "string", "应用版本"),
            ("max_file_size", "10485760", "int", "最大文件大小(字节)"),
            ("default_quota", "10", "int", "默认每日配额"),
            ("premium_quota", "100", "int", "付费用户每日配额"),
            ("session_timeout", "24", "int", "会话超时时间(小时)"),
            ("file_cleanup_days", "7", "int", "文件清理天数"),
            ("supported_formats", '["jpg", "jpeg", "png", "webp"]', "json", "支持的图片格式"),
            ("maintenance_mode", "false", "bool", "维护模式"),
            ("registration_enabled", "true", "bool", "是否允许新用户注册")
        ]
        
        for key, value, config_type, description in default_configs:
            existing = db_session.query(SystemConfig).filter(SystemConfig.config_key == key).first()
            if not existing:
                config = SystemConfig(
                    config_key=key,
                    config_value=value,
                    config_type=config_type,
                    description=description,
                    is_public=True
                )
                db_session.add(config)
        
        db_session.commit()
        print("✅ 默认系统配置初始化完成")
        
    finally:
        if close_session:
            db_session.close()

def check_database_connection():
    """检查数据库连接"""
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        print("✅ 数据库连接正常")
        return True
    except Exception as e:
        print(f"❌ 数据库连接失败: {e}")
        return False

def get_database_info():
    """获取数据库信息"""
    info = {
        "database_url": config.database_url.split('@')[-1] if '@' in config.database_url else config.database_url,
        "echo": config.echo,
        "is_sqlite": config.database_url.startswith("sqlite"),
        "pool_size": config.pool_size if not config.database_url.startswith("sqlite") else "N/A"
    }
    return info 