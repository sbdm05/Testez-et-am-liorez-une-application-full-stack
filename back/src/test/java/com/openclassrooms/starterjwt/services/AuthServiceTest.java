package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.EmailAlreadyTakenException;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.payload.request.LoginRequest;
import com.openclassrooms.starterjwt.payload.request.SignupRequest;
import com.openclassrooms.starterjwt.payload.response.JwtResponse;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.security.jwt.JwtUtils;
import com.openclassrooms.starterjwt.security.services.UserDetailsImpl;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Tests unitaires de AuthService.
 * Toutes les dépendances (Spring Security, JWT, repository) sont simulées avec Mockito.
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtils jwtUtils;

    @Mock
    private UserRepository userRepository;

    @Mock
    private Authentication authentication;   // résultat simulé d'une authentification réussie

    @InjectMocks
    private AuthService authService;

    private SignupRequest signupRequest;
    private LoginRequest loginRequest;
    private UserDetailsImpl userDetails;

    @BeforeEach
    void setUp() {
        signupRequest = new SignupRequest();
        signupRequest.setEmail("jane@studio.com");
        signupRequest.setFirstName("Jane");
        signupRequest.setLastName("Doe");
        signupRequest.setPassword("motdepasse");

        loginRequest = new LoginRequest();
        loginRequest.setEmail("jane@studio.com");
        loginRequest.setPassword("motdepasse");

        userDetails = UserDetailsImpl.builder()
                .id(1L)
                .username("jane@studio.com")
                .firstName("Jane")
                .lastName("Doe")
                .password("hashed")
                .build();
    }

    @AfterEach
    void tearDown() {
        // Le SecurityContext est global au thread : on le vide pour ne pas polluer les autres tests
        SecurityContextHolder.clearContext();
    }

    // ---------- register ----------

    @Test
    @DisplayName("TU-AUTH-01 - register enregistre un nouvel utilisateur avec un mot de passe chiffré, non admin")
    void register_shouldSaveUserWithEncodedPassword_whenEmailIsFree() {
        when(userRepository.existsByEmail("jane@studio.com")).thenReturn(false);
        when(passwordEncoder.encode("motdepasse")).thenReturn("hashed");

        authService.register(signupRequest);

        ArgumentCaptor<User> captor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(captor.capture());
        User saved = captor.getValue();
        assertThat(saved.getEmail()).isEqualTo("jane@studio.com");
        assertThat(saved.getFirstName()).isEqualTo("Jane");
        assertThat(saved.getLastName()).isEqualTo("Doe");
        assertThat(saved.getPassword()).isEqualTo("hashed");   // jamais le mot de passe en clair
        assertThat(saved.isAdmin()).isFalse();
    }

    @Test
    @DisplayName("TU-AUTH-02 - register lève EmailAlreadyTakenException quand l'email est déjà utilisé")
    void register_shouldThrowEmailAlreadyTaken_whenEmailExists() {
        when(userRepository.existsByEmail("jane@studio.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(signupRequest))
                .isInstanceOf(EmailAlreadyTakenException.class);

        verify(passwordEncoder, never()).encode(anyString());
        verify(userRepository, never()).save(any());
    }

    // ---------- login ----------

    @Test
    @DisplayName("TU-AUTH-03 - login renvoie le JWT et les infos de l'utilisateur, admin compris")
    void login_shouldReturnJwtResponse_whenCredentialsAreValid() {
        User adminUser = User.builder()
                .id(1L).email("jane@studio.com")
                .firstName("Jane").lastName("Doe")
                .password("hashed").admin(true)
                .build();
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("jwt-token");
        when(userRepository.findByEmail("jane@studio.com")).thenReturn(Optional.of(adminUser));

        JwtResponse response = authService.login(loginRequest);

        // Le token transmis à Spring Security contient bien l'email et le mot de passe saisis
        ArgumentCaptor<UsernamePasswordAuthenticationToken> captor =
                ArgumentCaptor.forClass(UsernamePasswordAuthenticationToken.class);
        verify(authenticationManager).authenticate(captor.capture());
        assertThat(captor.getValue().getPrincipal()).isEqualTo("jane@studio.com");
        assertThat(captor.getValue().getCredentials()).isEqualTo("motdepasse");

        // La réponse contient le JWT et les infos de l'utilisateur
        assertThat(response)
                .extracting("token", "id", "username", "firstName", "lastName", "admin")
                .containsExactly("jwt-token", 1L, "jane@studio.com", "Jane", "Doe", true);

        // L'utilisateur est enregistré comme connecté pour la suite de la requête
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isEqualTo(authentication);
    }

    @Test
    @DisplayName("TU-AUTH-04 - login renvoie admin = false quand l'utilisateur est introuvable en base")
    void login_shouldReturnAdminFalse_whenUserNotFoundInRepository() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenReturn(authentication);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(jwtUtils.generateJwtToken(authentication)).thenReturn("jwt-token");
        when(userRepository.findByEmail("jane@studio.com")).thenReturn(Optional.empty());

        JwtResponse response = authService.login(loginRequest);

        assertThat(response).extracting("admin").isEqualTo(false);
    }

    @Test
    @DisplayName("TU-AUTH-05 - login propage BadCredentialsException et ne génère pas de JWT si les identifiants sont faux")
    void login_shouldThrowBadCredentials_whenCredentialsAreInvalid() {
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        assertThatThrownBy(() -> authService.login(loginRequest))
                .isInstanceOf(BadCredentialsException.class);

        verify(jwtUtils, never()).generateJwtToken(any());
        assertThat(SecurityContextHolder.getContext().getAuthentication()).isNull();
    }
}