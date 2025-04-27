package com.example.restservice.payload.request;

import jakarta.validation.constraints.NotBlank;

public class LoginRequest {
	@NotBlank
	private String email; // Changed from username

	@NotBlank
	private String password;

	public String getEmail() { // Changed from getUsername
		return email;
	}

	public void setEmail(String email) { // Changed from setUsername
		this.email = email;
	}

	public String getPassword() {
		return password;
	}

	public void setPassword(String password) {
		this.password = password;
	}
}