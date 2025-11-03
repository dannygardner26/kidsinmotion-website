package com.example.restservice.security;

import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.FirebaseToken;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.UpdateRequest;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class FirebaseAuthService {

    public FirebaseToken verifyIdToken(String idToken) throws FirebaseAuthException {
        return FirebaseAuth.getInstance().verifyIdToken(idToken);
    }

    public String getUidFromToken(String idToken) {
        try {
            FirebaseToken decodedToken = verifyIdToken(idToken);
            return decodedToken.getUid();
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Firebase token", e);
        }
    }

    public String getEmailFromToken(String idToken) {
        try {
            FirebaseToken decodedToken = verifyIdToken(idToken);
            return decodedToken.getEmail();
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Firebase token", e);
        }
    }

    public String getNameFromToken(String idToken) {
        try {
            FirebaseToken decodedToken = verifyIdToken(idToken);
            return decodedToken.getName();
        } catch (FirebaseAuthException e) {
            throw new RuntimeException("Invalid Firebase token", e);
        }
    }

    public UserRecord getUserRecord(String uid) throws FirebaseAuthException {
        return FirebaseAuth.getInstance().getUser(uid);
    }

    public void setCustomUserClaims(String uid, Map<String, Object> claims) throws FirebaseAuthException {
        FirebaseAuth.getInstance().setCustomUserClaims(uid, claims);
    }

    public void revokeRefreshTokens(String uid) throws FirebaseAuthException {
        FirebaseAuth.getInstance().revokeRefreshTokens(uid);
    }

    public void updateUserEmail(String uid, String newEmail) throws FirebaseAuthException {
        UpdateRequest request = new UpdateRequest(uid).setEmail(newEmail);
        FirebaseAuth.getInstance().updateUser(request);
    }

    public void setEmailVerified(String uid, boolean verified) throws FirebaseAuthException {
        UpdateRequest request = new UpdateRequest(uid).setEmailVerified(verified);
        FirebaseAuth.getInstance().updateUser(request);
    }

    public void setUserPassword(String uid, String password) throws FirebaseAuthException {
        UpdateRequest request = new UpdateRequest(uid).setPassword(password);
        FirebaseAuth.getInstance().updateUser(request);
    }
}

