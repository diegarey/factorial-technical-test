from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from starlette.status import HTTP_307_TEMPORARY_REDIRECT
import re

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def legacy_redirect(request: Request, path: str):
    """
    Manejador para las rutas sin versión. 
    Redirecciona todas las solicitudes a la versión v1 de la API.
    """
    # Obtener la URL original y convertirla a v1
    original_url = str(request.url)
    target_url = original_url.replace("/api/", "/api/v1/", 1)
    
    print(f"Redireccionando solicitud de {original_url} a {target_url}")
    
    # Crear una respuesta de redirección
    return RedirectResponse(url=target_url, status_code=HTTP_307_TEMPORARY_REDIRECT) 