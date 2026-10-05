package com.openclassrooms.starterjwt.services;

import com.openclassrooms.starterjwt.exception.BadRequestException;
import com.openclassrooms.starterjwt.exception.NotFoundException;
import com.openclassrooms.starterjwt.models.Session;
import com.openclassrooms.starterjwt.models.User;
import com.openclassrooms.starterjwt.repository.SessionRepository;
import com.openclassrooms.starterjwt.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class SessionService {
    private final SessionRepository sessionRepository;

    private final UserRepository userRepository;

    public SessionService(SessionRepository sessionRepository, UserRepository userRepository) {
        this.sessionRepository = sessionRepository;
        this.userRepository = userRepository;
    }

    public Session create(Session session) {
        return this.sessionRepository.save(session);
    }

    // on vérifie l'existence avant de supprimer
    public void delete(Long id) {
        Session session = this.getById(id);
        this.sessionRepository.delete(session);
    }
    
    public List<Session> findAll() {
        return this.sessionRepository.findAll();
    }

    // Déclenche NotFoundException au lieu de renvoyer null
    public Session getById(Long id) {
        return this.sessionRepository.findById(id)
                .orElseThrow(NotFoundException::new);
    }

    public Session update(Long id, Session session) {
        session.setId(id);
        return this.sessionRepository.save(session);
    }


    // remove du if/else 
    // utilisation de orElseThrow

    public void participate(Long id, Long userId) {
        Session session = this.getById(id);
        User user = this.userRepository.findById(userId)
                .orElseThrow(NotFoundException::new);

        boolean alreadyParticipate = session.getUsers().stream().anyMatch(o -> o.getId().equals(userId));
        if (alreadyParticipate) {
            throw new BadRequestException();
        }

        session.getUsers().add(user);

        this.sessionRepository.save(session);
    }

    public void noLongerParticipate(Long id, Long userId) {
        Session session = this.getById(id);

        boolean alreadyParticipate = session.getUsers().stream().anyMatch(o -> o.getId().equals(userId));
        if (!alreadyParticipate) {
            throw new BadRequestException();
        }

        session.setUsers(session.getUsers().stream().filter(user -> !user.getId().equals(userId)).collect(Collectors.toList()));

        this.sessionRepository.save(session);
    }
}
