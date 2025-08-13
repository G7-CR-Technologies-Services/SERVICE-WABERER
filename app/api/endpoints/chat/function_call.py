from typing import List, Dict, Any

EXTRACT_HANDWRITING_FUNCTION = {
    "type": "function",  # Added 'type' field
    "function": {
        "name": "extract_handwritten_from_document",
        "description": "Extract both handwritten and typed text from PDF documents. Use this when users want to extract text, read content, pull text, or analyze document content.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
}

EXTRACT_TABLE_FUNCTION = {
    "type": "function",  # Added 'type' field
    "function": {
        "name": "extract_table_from_document",
        "description": "Extract table from PDF documents.use this when user wants to extract the table from document",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": []
        }
    }
}



Available_functions: List[Dict[str, Any]] = [EXTRACT_HANDWRITING_FUNCTION,EXTRACT_TABLE_FUNCTION]

def get_function_by_name(function_name: str) -> Dict[str, Any]:
    """
    Get function definition by name

    Args:
        function_name (str): Name of the function to retrieve

    Returns:
        Dict[str, Any]: Function definition or empty dict if not found
    """
    for func_wrapper in Available_functions:
        if func_wrapper.get("type") == "function" and func_wrapper["function"]["name"] == function_name:
            return func_wrapper["function"]
    return {}

def validate_function_call(function_name: str, arguments: Dict[str, Any],file) -> bool:
    """
    Validate if function call arguments match the schema

    Args:
        function_name (str): Name of the function
        arguments (Dict[str, Any]): Arguments to validate

    Returns:
        bool: True if valid, False otherwise
    """
    if function_name == FunctionNames.EXTRACT_HANDWRITING:
        if file:
            return True
    elif function_name == FunctionNames.EXTRACT_TABLE:
        if file:
            return True
    return False

class FunctionNames:
    """Constants for function names to avoid typos"""
    EXTRACT_HANDWRITING = "extract_handwritten_from_document"
    EXTRACT_TABLE = "extract_table_from_document"