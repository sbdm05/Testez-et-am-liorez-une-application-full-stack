package com.openclassrooms.starterjwt.controllers;

import com.jayway.jsonpath.JsonPath;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de AuthController : un test par endpoint.
 * Pas de @WithMockUser ici : on passe par la vraie chaîne de sécurité
 * (AuthenticationManager -> UserDetailsServiceImpl -> BCrypt -> JwtUtils -> AuthTokenFilter).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AuthControllerIntegrationTest {

    private static final String EMAIL = "yogi@test.com";
    private static final String PASSWORD = "test!1234";

    @Autowired
    private MockMvc mockMvc;

    // POST /api/auth/register avec un SignupRequest
    private ResultActions register() throws Exception {
        String body = """
                {
                  "email": "%s",
                  "firstName": "Yogi",
                  "lastName": "Tester",
                  "password": "%s"
                }
                """.formatted(EMAIL, PASSWORD);

        return mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(body));
    }

    @Test
    @DisplayName("TI-AUTH-01 : POST /api/auth/register renvoie 200 et un message de succès")
    void registerUser_newUser_returnsOk() throws Exception {
        register()
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("User registered successfully!"));
    }

    @Test
    @DisplayName("TI-AUTH-02 : POST /api/auth/login renvoie 200 et un token JWT utilisable")
    void authenticateUser_validCredentials_returnsUsableToken() throws Exception {
        register().andExpect(status().isOk());

        String loginBody = """
                {
                  "email": "%s",
                  "password": "%s"
                }
                """.formatted(EMAIL, PASSWORD);

        String response = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andReturn().getResponse().getContentAsString();

        // le token renvoyé doit ouvrir une route protégée (couvre AuthTokenFilter + JwtUtils)
        String token = JsonPath.read(response, "$.token");
        mockMvc.perform(get("/api/teacher").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }
}