import hashlib

from utils.fake_users_db import fake_users_db

async def authenticate_user(username: str, password: str):
    """Authenticate a user with username and password"""
    user = fake_users_db.get(username)
    if not user:
        return False
    if not await verify_password(password, user["password_hash"]):
        return False
    return user

async def hash_password(password: str) -> str:
    """Hash a password using SHA-256"""
    return hashlib.sha256(password.encode()).hexdigest()

async def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return await hash_password(plain_password) == hashed_password