import logging
from typing import Dict, Any, List, Optional
import firebase_admin
from firebase_admin import credentials, firestore
from app.core.config import settings

logger = logging.getLogger("hotel.firestore")

_db_instance = None

def get_firestore_client():
    """Initializes and returns the Firestore client singleton."""
    global _db_instance
    if _db_instance is not None:
        return _db_instance

    try:
        if not firebase_admin._apps:
            # Initialize with default options using project_id
            options = {
                'projectId': settings.FIREBASE_PROJECT_ID,
                'storageBucket': settings.FIREBASE_STORAGE_BUCKET
            }
            # Use ApplicationDefault or Anonymous creds for projectId-scoped Firestore
            cred = credentials.AnonymousCredentials() if hasattr(credentials, 'AnonymousCredentials') else None
            if cred:
                firebase_admin.initialize_app(cred, options)
            else:
                firebase_admin.initialize_app(options=options)
        
        _db_instance = firestore.client()
        logger.info(f"Connected to Firestore project: {settings.FIREBASE_PROJECT_ID}")
    except Exception as e:
        logger.warning(f"Firestore initialization note: {e}. Falling back to REST/Direct modes.")
        _db_instance = None

    return _db_instance


class FirestoreService:
    """Service to handle Firestore CRUD and synchronization for Hotel Management System."""
    
    def __init__(self):
        self.project_id = settings.FIREBASE_PROJECT_ID

    def store_document(self, collection: str, doc_id: str, data: Dict[str, Any]) -> bool:
        """Stores or updates a document in a specified Firestore collection."""
        client = get_firestore_client()
        if client:
            try:
                client.collection(collection).document(str(doc_id)).set(data, merge=True)
                return True
            except Exception as e:
                logger.error(f"Error writing to Firestore {collection}/{doc_id}: {e}")
        return False

    def get_document(self, collection: str, doc_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a document by ID from a Firestore collection."""
        client = get_firestore_client()
        if client:
            try:
                doc = client.collection(collection).document(str(doc_id)).get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Error reading Firestore {collection}/{doc_id}: {e}")
        return None

    def get_collection(self, collection: str, limit: int = 100) -> List[Dict[str, Any]]:
        """Retrieves documents from a Firestore collection."""
        client = get_firestore_client()
        if client:
            try:
                docs = client.collection(collection).limit(limit).stream()
                return [doc.to_dict() for doc in docs]
            except Exception as e:
                logger.error(f"Error streaming Firestore collection {collection}: {e}")
        return []

    def find_user_by_email(self, email: str) -> Optional[Dict[str, Any]]:
        """Queries Firestore users collection by email."""
        client = get_firestore_client()
        if client:
            try:
                docs = client.collection("users").where("email", "==", email.lower().strip()).limit(1).stream()
                for doc in docs:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Error querying Firestore user by email: {e}")
        return None


firestore_service = FirestoreService()
