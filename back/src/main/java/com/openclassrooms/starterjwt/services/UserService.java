package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.UserRepository;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.exception.UnauthorizedException;

import java.util.Objects;

import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;

    public UserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public void delete(Long id, String currentUserEmail) {
        User user = this.findById(id);                              // 404 si l'utilisateur n'existe pas
        if (!Objects.equals(user.getEmail(), currentUserEmail)) {
            throw new UnauthorizedException();                      // 401 si ce n'est pas son compte
        }
        this.userRepository.delete(user);
    }

    public User findById(Long id) throws NotFoundException {
        return this.userRepository.findById(id)
                .orElseThrow(NotFoundException::new);
    }
}
