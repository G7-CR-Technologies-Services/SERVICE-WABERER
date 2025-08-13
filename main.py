from fastapi import FastAPI
import logging,os
from app.core.origins import create_middleware, init_routers

#check if the utils directory exists else create it
if not os.path.exists("utils"):
    os.makedirs("utils")
    # set the file path for logging
    filepaths = os.path.join("utils", "Basic.logs")
else:
    # if the directory exists, set the file path for logging
    filepaths = os.path.join("utils","Basic.logs")  

   
def create_app()->FastAPI:
    app_=FastAPI(middleware=create_middleware(),title="wabererTestPOC",
                 version="V1.0"
    )
    filepath=filepaths
    logging.basicConfig(level=logging.DEBUG,
                        filename=filepath,
                        format="%(asctime)s || %(levelname)s || %(message)s",
                        datefmt="%Y-%m-%d %H:%M:%S")
    init_routers(app_=app_)
    return app_

app = create_app()