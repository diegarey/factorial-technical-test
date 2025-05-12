from fastapi import APIRouter, Depends, HTTPException, Response, Request
from fastapi.responses import RedirectResponse
from starlette.status import HTTP_307_TEMPORARY_REDIRECT
import re

router = APIRouter()

@router.api_route("/{path:path}", methods=["GET", "POST", "PUT", "DELETE"])
async def legacy_redirect(request: Request, path: str):
    """
    Redirige todas las peticiones a la API sin versión a la versión 1.
    Esto mantiene la compatibilidad con clientes que usaban la API anterior.
    """
    # Reconstruir la URL completa añadiendo /v1/ después de /api/
    target_url = request.url.path.replace("/api/", "/api/v1/", 1)
    
    # Si hay parámetros de consulta, mantenerlos en la redirección
    if request.query_params:
        query_string = str(request.query_params)
        target_url = f"{target_url}?{query_string}"
    
    # Registrar la redirección para depuración
    print(f"Redirigiendo petición de {request.url.path} a {target_url}")
    
    # Redirigir manteniendo el método HTTP
    return RedirectResponse(
        url=target_url,
        status_code=HTTP_307_TEMPORARY_REDIRECT
    ) 