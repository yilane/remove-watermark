from sqlalchemy import Column, String, Text, Boolean

from ..base import BaseModel

class SystemConfig(BaseModel):
    """系统配置表模型"""
    __tablename__ = "system_configs"
    
    # 配置项
    config_key = Column(String(100), unique=True, nullable=False, index=True, comment="配置键")
    config_value = Column(Text, nullable=True, comment="配置值")
    config_type = Column(String(20), default="string", comment="配置类型: string, int, float, bool, json")
    description = Column(Text, nullable=True, comment="配置描述")
    
    # 访问控制
    is_public = Column(Boolean, default=False, comment="是否为公开配置")
    
    def __repr__(self):
        return f"<SystemConfig(key={self.config_key}, type={self.config_type})>"
    
    @property
    def typed_value(self):
        """根据类型返回配置值"""
        if not self.config_value:
            return None
        
        if self.config_type == "int":
            try:
                return int(self.config_value)
            except ValueError:
                return 0
        elif self.config_type == "float":
            try:
                return float(self.config_value)
            except ValueError:
                return 0.0
        elif self.config_type == "bool":
            return self.config_value.lower() in ("true", "1", "yes", "on")
        elif self.config_type == "json":
            try:
                import json
                return json.loads(self.config_value)
            except (json.JSONDecodeError, TypeError):
                return {}
        else:
            return self.config_value
    
    def set_value(self, value, db_session=None):
        """设置配置值"""
        if self.config_type == "json":
            import json
            self.config_value = json.dumps(value, ensure_ascii=False)
        else:
            self.config_value = str(value)
        
        if db_session:
            db_session.commit()
    
    @classmethod
    def get_config(cls, db_session, key: str, default=None):
        """获取配置值"""
        config = db_session.query(cls).filter(cls.config_key == key).first()
        if config:
            return config.typed_value
        return default
    
    @classmethod
    def set_config(cls, db_session, key: str, value, config_type: str = "string", description: str = None):
        """设置配置值"""
        config = db_session.query(cls).filter(cls.config_key == key).first()
        
        if config:
            config.set_value(value, db_session)
        else:
            config = cls(
                config_key=key,
                config_type=config_type,
                description=description
            )
            config.set_value(value)
            db_session.add(config)
            db_session.commit()
        
        return config 