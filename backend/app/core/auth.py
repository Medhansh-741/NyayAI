from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError, jwk
from app.core.config import settings
import logging
import httpx
import time
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

# Cache for JWKS (Public Keys)
_jwks_cache: Optional[Dict[str, Any]] = None
_jwks_last_fetch: float = 0
JWKS_CACHE_TTL = 3600  # 1 hour

async def get_jwks() -> Optional[Dict[str, Any]]:
    global _jwks_cache, _jwks_last_fetch
    now = time.time()
    
    if _jwks_cache and (now - _jwks_last_fetch < JWKS_CACHE_TTL):
        return _jwks_cache
        
    try:
        jwks_url = f"{settings.SUPABASE_URL.rstrip('/')}/auth/v1/.well-known/jwks.json"
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(jwks_url)
            if response.status_code == 200:
                _jwks_cache = response.json()
                _jwks_last_fetch = now
                logger.info("Successfully fetched and cached Supabase JWKS.")
                return _jwks_cache
            else:
                logger.error(f"Failed to fetch JWKS: {response.status_code} - {response.text}")
    except Exception as e:
        logger.error(f"Error fetching JWKS: {str(e)}")
        
    return _jwks_cache # Return stale cache if fetch fails

security = HTTPBearer()

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    token = credentials.credentials
    try:
        # 1. Unverified header to determine algorithm
        try:
            header = jwt.get_unverified_header(token)
            alg = header.get("alg", "HS256")
        except Exception:
            alg = "HS256"

        # 2. Decode based on algorithm
        if alg == "HS256":
            payload = jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                options={"verify_aud": False}
            )
        elif alg == "ES256":
            jwks = await get_jwks()
            if not jwks:
                raise JWTError("Could not retrieve JWKS for ES256 verification")
            
            # Find the matching key in JWKS
            kid = header.get("kid")
            key_data = next((k for k in jwks.get("keys", []) if k.get("kid") == kid), None)
            if not key_data:
                # If no kid match, try finding any ES256 key
                key_data = next((k for k in jwks.get("keys", []) if k.get("alg") == "ES256"), None)
            
            if not key_data:
                raise JWTError(f"No matching ES256 key found in JWKS (kid: {kid})")
            
            # Convert to useable key and decode
            public_key = jwk.construct(key_data)
            payload = jwt.decode(
                token,
                public_key.to_dict(), # jose decode accepts dict representation for jwk
                algorithms=["ES256"],
                options={"verify_aud": False}
            )
        else:
            raise JWTError(f"Unsupported algorithm: {alg}")

        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing sub"
            )
        return payload
    except JWTError as e:
        logger.error(f"JWT Validation Failed ({alg}): {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Session expired or invalid: {str(e)}"
        )

async def get_current_citizen(user=Depends(get_current_user)):
    role = user.get("user_metadata", {}).get("role", "citizen")
    if role != "citizen":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Citizens only"
        )
    return user

async def get_current_lawyer(user=Depends(get_current_user)):
    role = user.get("user_metadata", {}).get("role")
    if role != "lawyer":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Lawyers only"
        )
    return user

async def get_current_admin(user=Depends(get_current_user)):
    role = user.get("user_metadata", {}).get("role")
    if role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admins only"
        )
    return user
