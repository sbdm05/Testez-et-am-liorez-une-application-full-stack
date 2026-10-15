package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.TeacherRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de SessionController : un test par endpoint (cas nominal).
 * Chaîne complète : contrôleur -> SessionMapper (toEntity / toDto) -> SessionService -> repositories -> H2.
 * Les cas d'erreur (404, 400, 401) sont déjà couverts par les tests unitaires et TeacherControllerIntegrationTest.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@WithMockUser   // sur la classe : tous les tests sont authentifiés
class SessionControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private SessionRepository sessionRepository;

    @Autowired
    private TeacherRepository teacherRepository;

    @Autowired
    private UserRepository userRepository;

    private Teacher teacher;
    private User user;
    private Session sessionWithoutUser;   // session vide, pour participate
    private Session sessionWithUser;      // session où "user" est déjà inscrit

    @BeforeEach
    void setUp() {
        teacher = teacherRepository.save(
                Teacher.builder().firstName("Margot").lastName("Delahaye").build());

        user = userRepository.save(User.builder()
                .email("yogi@test.com")
                .firstName("Yogi")
                .lastName("Test")
                .password("password-hash")
                .admin(false)
                .build());

        sessionWithoutUser = saveSession("Yoga doux", new ArrayList<>());
        sessionWithUser = saveSession("Yoga dynamique", new ArrayList<>(List.of(user)));
    }

    // liste mutable obligatoire : participate / noLongerParticipate modifient session.getUsers()
    private Session saveSession(String name, List<User> users) {
        return sessionRepository.save(Session.builder()
                .name(name)
                .date(new Date())
                .description("Séance de test")
                .teacher(teacher)
                .users(users)
                .build());
    }

    // corps JSON d'un SessionDto (text block Java = template literal JS)
    private String sessionJson(String name, Long teacherId) {
        return """
                {
                  "name": "%s",
                  "date": "2026-11-20",
                  "teacher_id": %d,
                  "description": "Séance créée par le test",
                  "users": []
                }
                """.formatted(name, teacherId);
    }

    @Test
    @DisplayName("TI-SESSION-01 : GET /api/session renvoie 200 et toutes les sessions")
    void findAll_returnsSessions() throws Exception {
        mockMvc.perform(get("/api/session"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItems("Yoga doux", "Yoga dynamique")));
    }

    @Test
    @DisplayName("TI-SESSION-02 : GET /api/session/{id} renvoie 200 avec teacher_id et users")
    void findById_existing_returnsSession() throws Exception {
        mockMvc.perform(get("/api/session/{id}", sessionWithUser.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Yoga dynamique"))
                .andExpect(jsonPath("$.teacher_id").value(teacher.getId()))
                .andExpect(jsonPath("$.users", hasItem(user.getId().intValue())));
    }

    @Test
    @DisplayName("TI-SESSION-03 : POST /api/session renvoie 200 et la session créée")
    void create_valid_returnsCreatedSession() throws Exception {
        mockMvc.perform(post("/api/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Yoga du matin", teacher.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Yoga du matin"))
                .andExpect(jsonPath("$.teacher_id").value(teacher.getId()));
    }

    @Test
    @DisplayName("TI-SESSION-04 : PUT /api/session/{id} renvoie 200 et la session modifiée")
    void update_valid_returnsUpdatedSession() throws Exception {
        mockMvc.perform(put("/api/session/{id}", sessionWithoutUser.getId())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(sessionJson("Yoga renommé", teacher.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(sessionWithoutUser.getId()))
                .andExpect(jsonPath("$.name").value("Yoga renommé"));
    }

    @Test
    @DisplayName("TI-SESSION-05 : DELETE /api/session/{id} renvoie 200 et la session n'existe plus")
    void delete_existing_removesSession() throws Exception {
        mockMvc.perform(delete("/api/session/{id}", sessionWithoutUser.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/session/{id}", sessionWithoutUser.getId()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("TI-SESSION-06 : POST participate renvoie 200 et l'utilisateur est inscrit")
    void participate_valid_addsUser() throws Exception {
        mockMvc.perform(post("/api/session/{id}/participate/{userId}",
                        sessionWithoutUser.getId(), user.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/session/{id}", sessionWithoutUser.getId()))
                .andExpect(jsonPath("$.users", hasItem(user.getId().intValue())));
    }

    @Test
    @DisplayName("TI-SESSION-07 : DELETE participate renvoie 200 et l'utilisateur est désinscrit")
    void noLongerParticipate_valid_removesUser() throws Exception {
        mockMvc.perform(delete("/api/session/{id}/participate/{userId}",
                        sessionWithUser.getId(), user.getId()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/session/{id}", sessionWithUser.getId()))
                .andExpect(jsonPath("$.users").isEmpty());
    }
}