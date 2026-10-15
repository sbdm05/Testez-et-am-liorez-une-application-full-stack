package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.Date;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de SessionService.
 * Les deux repositories sont simulés avec Mockito : aucune base de données, aucun contexte Spring.
 */
@ExtendWith(MockitoExtension.class)
class SessionServiceTest {

    @Mock
    private SessionRepository sessionRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private SessionService sessionService;

    private User alice;   // id 1
    private User bob;     // id 2
    private Session session;

    @BeforeEach
    void setUp() {
        alice = User.builder()
                .id(1L).email("alice@studio.com")
                .firstName("Alice").lastName("Martin")
                .password("hashed").admin(false)
                .build();
        bob = User.builder()
                .id(2L).email("bob@studio.com")
                .firstName("Bob").lastName("Durand")
                .password("hashed").admin(false)
                .build();

        // Session à laquelle seul Bob participe.
        // ArrayList (et pas List.of) car le service modifie la liste avec .add().
        session = Session.builder()
                .id(10L)
                .name("Yoga du matin")
                .date(new Date())
                .description("Séance douce pour bien démarrer")
                .users(new ArrayList<>(List.of(bob)))
                .build();
    }

    // ---------- create ----------

    @Test
    @DisplayName("TU-SESSION-01 - create enregistre la session et la renvoie")
    void create_shouldSaveAndReturnSession() {
        when(sessionRepository.save(session)).thenReturn(session);

        Session result = sessionService.create(session);

        assertThat(result).isEqualTo(session);
        verify(sessionRepository).save(session);
    }

    // ---------- findAll ----------

    @Test
    @DisplayName("TU-SESSION-02 - findAll renvoie toutes les sessions")
    void findAll_shouldReturnAllSessions() {
        when(sessionRepository.findAll()).thenReturn(List.of(session));

        List<Session> result = sessionService.findAll();

        assertThat(result).containsExactly(session);
    }

    // ---------- getById ----------

    @Test
    @DisplayName("TU-SESSION-03 - getById renvoie la session quand elle existe")
    void getById_shouldReturnSession_whenSessionExists() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        Session result = sessionService.getById(10L);

        assertThat(result).isEqualTo(session);
    }

    @Test
    @DisplayName("TU-SESSION-04 - getById lève NotFoundException quand la session n'existe pas")
    void getById_shouldThrowNotFound_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.getById(99L))
                .isInstanceOf(NotFoundException.class);
    }

    // ---------- update ----------

    @Test
    @DisplayName("TU-SESSION-05 - update force l'id reçu dans l'URL puis enregistre la session")
    void update_shouldSetIdAndSaveSession() {
        Session changes = Session.builder()
                .name("Yoga du soir")
                .date(new Date())
                .description("Séance relaxante")
                .build();                                   // pas d'id dans le corps de la requête
        when(sessionRepository.save(any(Session.class))).thenAnswer(call -> call.getArgument(0));

        Session result = sessionService.update(10L, changes);

        // On "capture" l'objet réellement passé à save() pour l'inspecter
        ArgumentCaptor<Session> captor = ArgumentCaptor.forClass(Session.class);
        verify(sessionRepository).save(captor.capture());
        assertThat(captor.getValue().getId()).isEqualTo(10L);
        assertThat(captor.getValue().getName()).isEqualTo("Yoga du soir");
        assertThat(result.getId()).isEqualTo(10L);
    }

    // ---------- delete ----------

    @Test
    @DisplayName("TU-SESSION-06 - delete supprime la session quand elle existe")
    void delete_shouldDeleteSession_whenSessionExists() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        sessionService.delete(10L);

        verify(sessionRepository).delete(session);
    }

    @Test
    @DisplayName("TU-SESSION-07 - delete lève NotFoundException et ne supprime rien quand la session n'existe pas")
    void delete_shouldThrowNotFound_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.delete(99L))
                .isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).delete(any());
    }

    // ---------- participate ----------

    @Test
    @DisplayName("TU-SESSION-08 - participate ajoute l'utilisateur à la session")
    void participate_shouldAddUserAndSave() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(1L)).thenReturn(Optional.of(alice));

        sessionService.participate(10L, 1L);

        assertThat(session.getUsers()).containsExactly(bob, alice);
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("TU-SESSION-09 - participate lève NotFoundException quand la session n'existe pas")
    void participate_shouldThrowNotFound_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.participate(99L, 1L))
                .isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("TU-SESSION-10 - participate lève NotFoundException quand l'utilisateur n'existe pas")
    void participate_shouldThrowNotFound_whenUserDoesNotExist() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.participate(10L, 99L))
                .isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("TU-SESSION-11 - participate lève BadRequestException quand l'utilisateur participe déjà")
    void participate_shouldThrowBadRequest_whenUserAlreadyParticipates() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));
        when(userRepository.findById(2L)).thenReturn(Optional.of(bob));

        assertThatThrownBy(() -> sessionService.participate(10L, 2L))
                .isInstanceOf(BadRequestException.class);

        assertThat(session.getUsers()).containsExactly(bob);   // pas de doublon
        verify(sessionRepository, never()).save(any());
    }

    // ---------- noLongerParticipate ----------

    @Test
    @DisplayName("TU-SESSION-12 - noLongerParticipate retire l'utilisateur de la session")
    void noLongerParticipate_shouldRemoveUserAndSave() {
        session.getUsers().add(alice);                          // Bob et Alice participent
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        sessionService.noLongerParticipate(10L, 2L);            // Bob se désinscrit

        assertThat(session.getUsers()).containsExactly(alice);  // Alice reste
        verify(sessionRepository).save(session);
    }

    @Test
    @DisplayName("TU-SESSION-13 - noLongerParticipate lève BadRequestException quand l'utilisateur ne participe pas")
    void noLongerParticipate_shouldThrowBadRequest_whenUserDoesNotParticipate() {
        when(sessionRepository.findById(10L)).thenReturn(Optional.of(session));

        assertThatThrownBy(() -> sessionService.noLongerParticipate(10L, 1L))   // Alice n'est pas inscrite
                .isInstanceOf(BadRequestException.class);

        verify(sessionRepository, never()).save(any());
    }

    @Test
    @DisplayName("TU-SESSION-14 - noLongerParticipate lève NotFoundException quand la session n'existe pas")
    void noLongerParticipate_shouldThrowNotFound_whenSessionDoesNotExist() {
        when(sessionRepository.findById(99L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> sessionService.noLongerParticipate(99L, 1L))
                .isInstanceOf(NotFoundException.class);

        verify(sessionRepository, never()).save(any());
    }
}