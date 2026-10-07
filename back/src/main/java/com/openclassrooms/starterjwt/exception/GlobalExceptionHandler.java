package com.openclassrooms.starterjwt.exception;

import com.openclassrooms.starterjwt.payload.response.MessageResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // gère une ressource introuvable
    @ExceptionHandler(NotFoundException.class)
    public ResponseEntity<Void> handleNotFound(NotFoundException e) {
        return ResponseEntity.notFound().build();
    }

    // gère une règle non respectée, par exemple l'utilisateur est déjà inscrit à la session
    @ExceptionHandler(BadRequestException.class)
    public ResponseEntity<Void> handleBadRequest(BadRequestException e) {
        return ResponseEntity.badRequest().build();
    }

    // gère un id invalide dans l'URL
    @ExceptionHandler(MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e) {
        return ResponseEntity.badRequest().build();
    }

    // gère une action non autorisée, par exemple supprimer le compte d'un autre utilisateur
    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Void> handleUnauthorized(UnauthorizedException e) {
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }

    // gère un email déjà utilisé à l'inscription
    @ExceptionHandler(EmailAlreadyTakenException.class)
    public ResponseEntity<MessageResponse> handleEmailAlreadyTaken(EmailAlreadyTakenException e) {
        return ResponseEntity.badRequest().body(new MessageResponse(e.getMessage()));
    }
}