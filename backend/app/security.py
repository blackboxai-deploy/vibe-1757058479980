"""
ماژول امنیتی برای رمزنگاری کلیدهای API
Security module for encrypting API keys and secrets
"""
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.backends import default_backend
import base64
import os
import secrets
from typing import str, bytes

class SecurityManager:
    """مدیریت امنیتی و رمزنگاری"""
    
    def __init__(self, master_key: str = None):
        """
        Initialize security manager with encryption capability
        
        Args:
            master_key: کلید اصلی برای رمزنگاری (اختیاری)
        """
        if master_key:
            self.fernet = self._create_fernet_from_password(master_key)
        else:
            # استفاده از کلید پیش‌فرض از تنظیمات
            self.fernet = Fernet(self._derive_key_from_config())
    
    def _create_fernet_from_password(self, password: str, salt: bytes = None) -> Fernet:
        """ایجاد کلید Fernet از رمز عبور"""
        if salt is None:
            salt = os.urandom(16)
        
        kdf = PBKDF2HMAC(
            algorithm=hashes.SHA256(),
            length=32,
            salt=salt,
            iterations=100000,
            backend=default_backend()
        )
        key = base64.urlsafe_b64encode(kdf.derive(password.encode()))
        return Fernet(key)
    
    def _derive_key_from_config(self) -> bytes:
        """استخراج کلید از تنظیمات"""
        from .config import settings
        return base64.urlsafe_b64encode(settings.ENCRYPTION_KEY)
    
    def encrypt_api_key(self, api_key: str) -> str:
        """
        رمزنگاری کلید API
        
        Args:
            api_key: کلید API خام
            
        Returns:
            str: کلید رمزنگاری شده در فرمت base64
        """
        if not api_key:
            raise ValueError("API key cannot be empty")
        
        encrypted_data = self.fernet.encrypt(api_key.encode())
        return base64.urlsafe_b64encode(encrypted_data).decode()
    
    def decrypt_api_key(self, encrypted_key: str) -> str:
        """
        رمزگشایی کلید API
        
        Args:
            encrypted_key: کلید رمزنگاری شده
            
        Returns:
            str: کلید API اصلی
        """
        if not encrypted_key:
            raise ValueError("Encrypted key cannot be empty")
        
        try:
            encrypted_data = base64.urlsafe_b64decode(encrypted_key.encode())
            decrypted_data = self.fernet.decrypt(encrypted_data)
            return decrypted_data.decode()
        except Exception as e:
            raise ValueError(f"Failed to decrypt API key: {str(e)}")
    
    def encrypt_secret(self, secret: str) -> str:
        """رمزنگاری Secret (مشابه API key)"""
        return self.encrypt_api_key(secret)
    
    def decrypt_secret(self, encrypted_secret: str) -> str:
        """رمزگشایی Secret"""
        return self.decrypt_api_key(encrypted_secret)
    
    @staticmethod
    def generate_secure_token(length: int = 32) -> str:
        """تولید توکن امن تصادفی"""
        return secrets.token_urlsafe(length)
    
    @staticmethod
    def generate_salt() -> str:
        """تولید salt برای هش کردن"""
        return secrets.token_hex(16)
    
    def hash_user_id(self, user_id: str) -> str:
        """هش کردن شناسه کاربر برای امنیت بیشتر"""
        import hashlib
        return hashlib.sha256(user_id.encode()).hexdigest()
    
    def validate_api_credentials(self, api_key: str, secret: str) -> bool:
        """اعتبارسنجی اولیه کلیدهای API"""
        if not api_key or not secret:
            return False
        
        # بررسی طول مینیمم
        if len(api_key) < 10 or len(secret) < 10:
            return False
        
        # بررسی کاراکترهای مجاز
        allowed_chars = set("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
        if not set(api_key).issubset(allowed_chars) or not set(secret).issubset(allowed_chars):
            return False
        
        return True

# Instance سراسری برای استفاده در سرتاسر برنامه
security_manager = SecurityManager()