package com.openclassrooms.starterjwt.exception;

public class EmailAlreadyTakenException extends RuntimeException {
    public EmailAlreadyTakenException() {
        super("Error: Email is already taken!");
    }
}