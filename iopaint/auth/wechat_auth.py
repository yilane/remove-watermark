import aiohttp
import json
import os
from typing import Optional, Dict, Any
from datetime import datetime

class WeChatAuthClient:
    """微信认证客户端"""
    
    def __init__(self):
        self.app_id = os.getenv("WECHAT_APP_ID")
        self.app_secret = os.getenv("WECHAT_APP_SECRET")
        self.base_url = "https://api.weixin.qq.com"
        
        if not self.app_id or not self.app_secret:
            print("⚠️ 警告: 未配置微信小程序 AppID 和 AppSecret")
    
    async def code_to_session(self, code: str) -> Optional[Dict[str, Any]]:
        """
        通过临时登录凭证获取session_key和openid
        
        Args:
            code: 微信小程序wx.login()返回的code
            
        Returns:
            包含openid和session_key的字典，失败返回None
        """
        if not self.app_id or not self.app_secret:
            return {
                "error": "missing_config",
                "error_description": "微信小程序配置缺失"
            }
        
        url = f"{self.base_url}/sns/jscode2session"
        params = {
            "appid": self.app_id,
            "secret": self.app_secret,
            "js_code": code,
            "grant_type": "authorization_code"
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        
                        # 检查是否有错误
                        if "errcode" in data:
                            return {
                                "error": "wechat_api_error",
                                "error_description": f"微信API错误: {data.get('errmsg', 'Unknown error')}",
                                "errcode": data["errcode"]
                            }
                        
                        return {
                            "openid": data.get("openid"),
                            "session_key": data.get("session_key"),
                            "unionid": data.get("unionid")
                        }
                    else:
                        return {
                            "error": "http_error",
                            "error_description": f"HTTP请求失败: {response.status}"
                        }
                        
        except Exception as e:
            return {
                "error": "network_error",
                "error_description": f"网络请求异常: {str(e)}"
            }
    
    async def get_user_info(self, session_key: str, encrypted_data: str, iv: str) -> Optional[Dict[str, Any]]:
        """
        解密用户信息
        
        Args:
            session_key: 会话密钥
            encrypted_data: 加密的用户数据
            iv: 初始向量
            
        Returns:
            解密后的用户信息，失败返回None
        """
        try:
            from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
            from cryptography.hazmat.backends import default_backend
            import base64
            
            # Base64解码
            session_key = base64.b64decode(session_key)
            encrypted_data = base64.b64decode(encrypted_data)
            iv = base64.b64decode(iv)
            
            # AES解密
            cipher = Cipher(algorithms.AES(session_key), modes.CBC(iv), backend=default_backend())
            decryptor = cipher.decryptor()
            decrypted = decryptor.update(encrypted_data) + decryptor.finalize()
            
            # 移除PKCS7填充
            pad = decrypted[-1]
            decrypted = decrypted[:-pad]
            
            # 解析JSON
            user_info = json.loads(decrypted.decode('utf-8'))
            return user_info
            
        except Exception as e:
            print(f"用户信息解密失败: {e}")
            return None
    
    async def get_access_token(self) -> Optional[str]:
        """
        获取小程序全局唯一后台接口调用凭据
        
        Returns:
            access_token字符串，失败返回None
        """
        if not self.app_id or not self.app_secret:
            return None
        
        url = f"{self.base_url}/cgi-bin/token"
        params = {
            "grant_type": "client_credential",
            "appid": self.app_id,
            "secret": self.app_secret
        }
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(url, params=params) as response:
                    if response.status == 200:
                        data = await response.json()
                        if "access_token" in data:
                            return data["access_token"]
                        else:
                            print(f"获取access_token失败: {data}")
                            return None
                    else:
                        print(f"HTTP请求失败: {response.status}")
                        return None
                        
        except Exception as e:
            print(f"获取access_token异常: {e}")
            return None
    
    def validate_signature(self, raw_data: str, signature: str, session_key: str) -> bool:
        """
        验证数据签名
        
        Args:
            raw_data: 原始数据
            signature: 数据签名
            session_key: 会话密钥
            
        Returns:
            验证结果
        """
        try:
            import hashlib
            import hmac
            
            # 计算签名
            expected_signature = hmac.new(
                session_key.encode('utf-8'),
                raw_data.encode('utf-8'),
                hashlib.sha1
            ).hexdigest()
            
            return signature == expected_signature
            
        except Exception as e:
            print(f"签名验证异常: {e}")
            return False

# 全局微信客户端实例
wechat_client = WeChatAuthClient() 