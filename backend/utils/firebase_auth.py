import firebase_admin
from firebase_admin import credentials, auth
from fastapi import HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer

cred = credentials.Certificate("backend/firebase-service-account.json")

firebase_admin.initialize_app(cred)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")


def verify_firebase_token(token: str = Depends(oauth2_scheme)):

    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token

    except Exception:
        raise HTTPException(status_code=401, detail="Invalid Firebase token")