package com.example.restservice.payload.response;

import com.example.restservice.model.Participant;

public class ParticipantRegistrationResponse {
    private Participant participant;
    private String message;

    public ParticipantRegistrationResponse(Participant participant, String message) {
        this.participant = participant;
        this.message = message;
    }

    // Getters and Setters
    public Participant getParticipant() {
        return participant;
    }

    public void setParticipant(Participant participant) {
        this.participant = participant;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }
}