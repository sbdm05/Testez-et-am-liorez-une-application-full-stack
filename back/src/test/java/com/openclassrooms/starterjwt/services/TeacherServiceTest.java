package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Teacher;
import com.openclassrooms.starterjwt.repository.TeacherRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de TeacherService.
 * Le repository est simulé avec Mockito : aucune base de données, aucun contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class TeacherServiceTest {

    @Mock
    private TeacherRepository teacherRepository;

    @InjectMocks
    private TeacherService teacherService;

    private Teacher teacher1;
    private Teacher teacher2;

    @BeforeEach
    void setUp() {
        teacher1 = Teacher.builder()
                .id(1L)
                .firstName("Margot")
                .lastName("Delahaye")
                .build();
        teacher2 = Teacher.builder()
                .id(2L)
                .firstName("Hélène")
                .lastName("Thiercelin")
                .build();
    }

    // ---------- findAll ----------

    @Test
    @DisplayName("TU-TEACHER-01 - findAll renvoie tous les professeurs")
    void findAll_shouldReturnAllTeachers() {
        when(teacherRepository.findAll()).thenReturn(List.of(teacher1, teacher2));

        List<Teacher> result = teacherService.findAll();

        assertThat(result).containsExactly(teacher1, teacher2);
        verify(teacherRepository).findAll();
    }

    @Test
    @DisplayName("TU-TEACHER-02 - findAll renvoie une liste vide quand il n'y a aucun professeur")
    void findAll_shouldReturnEmptyList_whenNoTeacher() {
        when(teacherRepository.findAll()).thenReturn(List.of());

        List<Teacher> result = teacherService.findAll();

        assertThat(result).isEmpty();
    }

    // ---------- findById ----------

    @Test
    @DisplayName("TU-TEACHER-03 - findById renvoie le professeur quand il existe")
    void findById_shouldReturnTeacher_whenTeacherExists() {
        when(teacherRepository.findById(1L)).thenReturn(Optional.of(teacher1));

        Teacher result = teacherService.findById(1L);

        assertThat(result).isEqualTo(teacher1);
    }

    @Test
    @DisplayName("TU-TEACHER-04 - findById lève NotFoundException quand le professeur n'existe pas")
    void findById_shouldThrowNotFound_whenTeacherDoesNotExist() {
        when(teacherRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> teacherService.findById(99L))
                .isInstanceOf(NotFoundException.class);
    }
}