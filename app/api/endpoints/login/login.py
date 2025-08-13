from fastapi import APIRouter,Form

from fastapi.security import OAuth2PasswordBearer
from app.model.models import LoginResponse
from app.api.endpoints.login.function import authenticate_user
from app.core.common import create_access_token
from app.core.config import ACCESS_TOKEN_EXPIRE_MINUTES
from datetime import timedelta

login_router = APIRouter(
    tags = ["login"]
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/login")

@login_router.post("/login",response_model=LoginResponse)
async def login_auth(
    username: str = Form(...),
    password: str = Form(...)
):
    """
    Authenticate user and return access token
    
    Args:
        username: User's username (form data)
        password: User's password (form data)
    
    Returns:
        LoginResponse with success status, access token, and message
    """
    
    # Authenticate user
    user = await authenticate_user(username, password)
    
    if not user:
        return LoginResponse(
            success=False,
            message="Invalid login credentials."
        )
    
    # Create access token
    access_token_expires = timedelta(minutes=int(ACCESS_TOKEN_EXPIRE_MINUTES))
    access_token = create_access_token(
        data={"sub": user["username"]}, 
        expires_delta=access_token_expires
    )
    
    return LoginResponse(
        success=True,
        access_token=access_token,
        message="Login successful"
    )
    