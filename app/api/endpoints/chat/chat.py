from fastapi import APIRouter,UploadFile,File,Form,HTTPException,Request
from fastapi.responses import JSONResponse
from app.model.models import chatRequest,saveRequest,ApiResponse, SaveFileRequest
from typing import Optional
import requests
import os,shutil,tempfile
from langdetect import detect  
from app.api.endpoints.chat.function import fn_chatbot,fn_save_text,fn_upload_blob_and_get_sas

chat_router = APIRouter(
    tags = ["documentAnalysis"]
)

@chat_router.post("/chat")
async def chatbot(message: str = Form(...), file: UploadFile = File(None),session_id : str = Form(None)) -> JSONResponse:
    """ Endpoint to handle the chat request
    Args:
        request (UploadFile): The file to be analyzed.
    Returns:
        JSONResponse: The response containing the analysis result."""
    try:
        response = await fn_chatbot(message,file,session_id)
        print(response)
        return JSONResponse(response.model_dump(), status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    
@chat_router.post("/save-text")
async def save_text(request: saveRequest):
    """ Endpoint to save the extracted text
    Args:
        request (saveRequest): The request containing the temporary blob URL.
    Returns:
        JSONResponse: The response permanent blob URL with status code and sucess message."""
    try:
        response = await fn_save_text(request.blob_url)
        return JSONResponse(response.model_dump(), status_code=200)
    except Exception as e:
        return JSONResponse({"error": str(e)}, status_code=500)
    

@chat_router.post("/save")
def save_file(req: SaveFileRequest):
    temp_file_path = None
    final_target_path = None

    try:
        print("Received SaveFileRequest:", req)

        # Step 1: Download file from the provided URL
        print("Downloading file from URL:", req.url)
        response = requests.get(req.url)
        print("Download status:", response.status_code)

        if response.status_code != 200:
            raise HTTPException(status_code=400, detail="Failed to download file from URL")

        # Step 2: Determine a clean filename
        base_name = os.path.splitext(req.original_filename)[0]
        clean_name = base_name.replace(" ", "_")
        final_filename = f"{clean_name}.xlsx"
        print("Final filename:", final_filename)

        # Step 3: Save to a temporary file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".xlsx") as temp_file:
            temp_file.write(response.content)
            temp_file_path = temp_file.name
        print("Temp file path:", temp_file_path)

        # Step 4: Rename/move to final filename
        final_target_path = os.path.join(os.path.dirname(temp_file_path), final_filename)

        # Safely remove existing file if it already exists
        if os.path.exists(final_target_path):
            os.remove(final_target_path)

        # Move file to the new path (safer than rename on Windows)
        shutil.move(temp_file_path, final_target_path)
        print("Moved to:", final_target_path)

        # Step 5: Upload to Azure Blob and get SAS URL
        sas_url = fn_upload_blob_and_get_sas(final_target_path, container_name="extracted-files")
        print("SAS URL:", sas_url)

        # Step 6: Cleanup
        if os.path.exists(final_target_path):
            os.remove(final_target_path)
            print(" Final file removed after upload.")

        return JSONResponse(
            {"message": f"{final_filename}", "sas_url": sas_url},
            status_code=200
        )

    except Exception as e:
        print("Exception occurred:", str(e))
        raise HTTPException(status_code=500, detail="Internal Server Error: " + str(e))

    finally:
        # Ensure temp file is removed if something goes wrong
        if temp_file_path and os.path.exists(temp_file_path):
            os.remove(temp_file_path)
            print("Temp file cleaned up in finally block.")


@chat_router.post("/detect-language")
async def detect_language(request: Request):
    try:
        data = await request.json()
        message = data.get("text", "")
        lang_code = detect(message)
        return JSONResponse(content={"language": lang_code}, status_code=200)
    except Exception as e:
        return JSONResponse(content={"error": str(e)}, status_code=500)