package com.openclassrooms.starterjwt.controllers;

import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.repository.TeacherRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Tests d'intégration de TeacherController.
 * Contexte Spring complet : contrôleur -> service -> mapper -> repository -> H2.
 * Seule l'authentification JWT est court-circuitée par @WithMockUser.
 */
@SpringBootTest            // démarre toute l'application (comme un TestBed avec les vrais services)
@AutoConfigureMockMvc      // fournit MockMvc pour simuler des requêtes HTTP sans serveur réel
@Transactional             // rollback après chaque test : la base H2 redevient vide
class TeacherControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private TeacherRepository teacherRepository;

    private Teacher teacher1;

    @BeforeEach
    void setUp() {
        teacher1 = saveTeacher("Margot", "Delahaye");
        saveTeacher("Hélène", "Thiercelin");
    }

    // insère un professeur dans H2 et renvoie l'entité avec son id généré
    private Teacher saveTeacher(String firstName, String lastName) {
        Teacher teacher = new Teacher();
        teacher.setFirstName(firstName);
        teacher.setLastName(lastName);
        return teacherRepository.save(teacher);
    }

    @Test
    @WithMockUser
    @DisplayName("TI-TEACHER-01 : GET /api/teacher renvoie 200 et la liste des professeurs")
    void findAll_authenticated_returnsTeachers() throws Exception {
        mockMvc.perform(get("/api/teacher"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$[*].lastName", hasItems("Delahaye", "Thiercelin")));
    }

    @Test
    @WithMockUser
    @DisplayName("TI-TEACHER-02 : GET /api/teacher/{id} renvoie 200 et le professeur")
    void findById_existing_returnsTeacher() throws Exception {
        mockMvc.perform(get("/api/teacher/{id}", teacher1.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(teacher1.getId()))
                .andExpect(jsonPath("$.firstName").value("Margot"))
                .andExpect(jsonPath("$.lastName").value("Delahaye"));
    }

    @Test
    @WithMockUser
    @DisplayName("TI-TEACHER-03 : GET /api/teacher/{id} inexistant renvoie 404")
    void findById_unknown_returnsNotFound() throws Exception {
        mockMvc.perform(get("/api/teacher/{id}", 999_999L))
                .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser
    @DisplayName("TI-TEACHER-04 : GET /api/teacher/abc (id non numérique) renvoie 400")
    void findById_invalidId_returnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/teacher/abc"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("TI-TEACHER-05 : GET /api/teacher sans authentification renvoie 401")
    void findAll_unauthenticated_returnsUnauthorized() throws Exception {
        mockMvc.perform(get("/api/teacher"))
                .andExpect(status().isUnauthorized());
    }
}