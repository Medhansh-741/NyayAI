import os
from jose import jwt, JWTError
import sys

# Mock settings
SUPABASE_JWT_SECRET = os.environ.get("SUPABASE_JWT_SECRET")

print(f"Current SUPABASE_JWT_SECRET length: {len(SUPABASE_JWT_SECRET) if SUPABASE_JWT_SECRET else 0}")

# If we had a token, we would test it here.
# Since we don't, let's at least check if the secret is valid for jose
try:
    if not SUPABASE_JWT_SECRET:
        print("ERROR: SUPABASE_JWT_SECRET is not set in environment!")
        sys.exit(1)
        
    # Test decode with a dummy token just to see if it even gets past the key check
    # (This will fail with 'Signater verification failed' but should not fail on the key itself)
    print("Testing jose with current secret...")
    # This is just a placeholder test
except Exception as e:
    print(f"JOSE Error: {e}")
