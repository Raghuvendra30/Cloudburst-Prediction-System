import hashlib
from datetime import datetime, timedelta
from typing import Optional, Dict, Any

import jwt
from passlib.context import CryptContext

# -----------------------------
# PASSWORD HASHING (bcrypt)
# -----------------------------
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Change this secret in production (keep in .env)
JWT_SECRET_KEY = "CLOUDBURST_SECRET_KEY_12345"
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = 60 * 24  # 1 day


def _normalize_password(password: str) -> str:
    """
    bcrypt supports max 72 bytes.
    If longer, pre-hash using SHA256 safely.
    """
    if password is None:
        raise ValueError("Password cannot be empty")

    password = password.strip()

    if len(password.encode("utf-8")) <= 72:
        return password

    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def hash_password(password: str) -> str:
    password = _normalize_password(password)
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    plain_password = _normalize_password(plain_password)
    return pwd_context.verify(plain_password, hashed_password)


# -----------------------------
# JWT TOKEN FUNCTIONS
# -----------------------------
def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Creates JWT token
    """
    to_encode = data.copy()

    expire = datetime.utcnow() + (expires_delta if expires_delta else timedelta(minutes=JWT_EXPIRE_MINUTES))
    to_encode.update({"exp": expire})

    token = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return token


def decode_token(token: str) -> Dict[str, Any]:
    """
    Decodes JWT token
    """
    payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
    return payload