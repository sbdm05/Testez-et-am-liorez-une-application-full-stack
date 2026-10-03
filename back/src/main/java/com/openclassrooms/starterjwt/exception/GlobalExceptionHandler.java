package com.openclassrooms.starterjwt.exception;

import org.apache.coyote.BadRequestException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

public class GlobalExceptionHandler {
    // gère une ressource introuvable
    @ExceptionHandler (NotFoundException.class)
    public ResponseEntity<Void> handleNotFound(NotFoundException e){
        return ResponseEntity.notFound().build();
    }
    
    // gère une règle non respecté; par exemple le user est déjà dans une session 
    @ExceptionHandler (BadRequestException.class)
    public ResponseEntity<Void> handleBadRequest(BadRequestException e){
        return ResponseEntity.badRequest().build();
    }

    // gère un id invalide dans l'url
    @ExceptionHandler (MethodArgumentTypeMismatchException.class)
    public ResponseEntity<Void> handleTypeMismatch(MethodArgumentTypeMismatchException e){
        return ResponseEntity.badRequest().build(); 
    }
}
