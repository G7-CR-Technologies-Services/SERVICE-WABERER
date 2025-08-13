from pydantic import BaseModel
# from fastapi import UploadFile, File
from typing import Optional, Dict, Any

class ApiResponse(BaseModel):
    statusCode:int
    message:str = None
    data:dict = None

class chatRequest(BaseModel):
    message: str = None

class saveRequest(BaseModel):
    blob_url: str = None

class LoginResponse(BaseModel):
    success: bool
    access_token: Optional[str] = None
    message: Optional[str] = None
    token_type: str = "bearer"

class SaveFileRequest(BaseModel):
    title: str
    url: str
    original_filename: Optional[str] = None