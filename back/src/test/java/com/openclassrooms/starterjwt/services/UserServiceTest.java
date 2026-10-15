package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.exception.UnauthorizedException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de UserService.
 * Le repository est simulé avec Mockito : aucune base de données, aucun contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;   // faux repository (≈ jest.fn() pour chaque méthode)

    @InjectMocks
    private UserService userService;         // vrai service, construit avec le faux repository

    private User user;

    @BeforeEach
    void setUp() {
        user = User.builder()
                .id(1L)
                .email("yoga@studio.com")
                .firstName("Jane")
                .lastName("Doe")
                .password("hashed-password")
                .admin(false)
                .build();
    }

    // ---------- findById ----------

    @Test
    @DisplayName("TU-USER-01 - findById renvoie l'utilisateur quand il existe")
    void findById_shouldReturnUser_whenUserExists() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        // Act
        User result = userService.findById(1L);

        // Assert
        assertThat(result).isEqualTo(user);
        verify(userRepository).findById(1L);
    }

    @Test
    @DisplayName("TU-USER-02 - findById lève NotFoundException quand l'utilisateur n'existe pas")
    void findById_shouldThrowNotFound_whenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.findById(99L))
                .isInstanceOf(NotFoundException.class);
    }

    // ---------- delete ----------

    @Test
    @DisplayName("TU-USER-03 - delete supprime le compte quand c'est celui de l'utilisateur connecté")
    void delete_shouldDeleteUser_whenItIsOwnAccount() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        userService.delete(1L, "yoga@studio.com");

        verify(userRepository).delete(user);
    }

    @Test
    @DisplayName("TU-USER-04 - delete lève UnauthorizedException quand ce n'est pas son compte")
    void delete_shouldThrowUnauthorized_whenItIsAnotherUsersAccount() {
        when(userRepository.findById(1L)).thenReturn(Optional.of(user));

        assertThatThrownBy(() -> userService.delete(1L, "intrus@studio.com"))
                .isInstanceOf(UnauthorizedException.class);

        verify(userRepository, never()).delete(any());
    }

    @Test
    @DisplayName("TU-USER-05 - delete lève NotFoundException quand l'utilisateur n'existe pas")
    void delete_shouldThrowNotFound_whenUserDoesNotExist() {
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> userService.delete(99L, "yoga@studio.com"))
                .isInstanceOf(NotFoundException.class);

        verify(userRepository, never()).delete(any());
    }
}