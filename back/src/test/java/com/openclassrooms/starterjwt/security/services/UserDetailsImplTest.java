package com.openclassrooms.starterjwt.security.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Test unitaire de UserDetailsImpl.equals : pas de Spring, pas de mock, pas de base.
 * equals est appelé directement (et non via assertEquals / isEqualTo),
 * car ces assertions vérifient d'abord "a == b" et n'appelleraient pas toujours equals.
 */
class UserDetailsImplTest {

    private UserDetailsImpl userWithId(Long id) {
        return UserDetailsImpl.builder()
                .id(id)
                .username("yogi@test.com")
                .firstName("Yogi")
                .lastName("Tester")
                .admin(false)
                .password("password-hash")
                .build();
    }

    @Test
    @DisplayName("TU-USERDETAILS-01 : equals compare deux utilisateurs uniquement sur leur id")
    void equals_comparesOnId() {
        UserDetailsImpl user = userWithId(1L);

        assertTrue(user.equals(user));               // même instance        -> this == o
        assertFalse(user.equals(null));              // null                 -> o == null
        assertFalse(user.equals("yogi@test.com"));   // autre type d'objet   -> getClass() différent
        assertTrue(user.equals(userWithId(1L)));     // autre instance, même id -> Objects.equals(id)
    }
}