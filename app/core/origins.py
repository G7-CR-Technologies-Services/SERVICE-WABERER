from typing import List
from fastapi.middleware import Middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI
from app.api.endpoints.chat import chat
from app.api.endpoints.login import login


origins=["*"]

def create_middleware()->List[Middleware]:
    middleware=[
        Middleware(
            CORSMiddleware,
            allow_origins=origins,
            allow_methods=["*"],
            allow_headers=["*"],
            allow_credentials=True            
        )
    ]
    return middleware

def init_routers(app_:FastAPI)->None:
    app_.include_router(chat.chat_router)
    app_.include_router(login.login_router)
    