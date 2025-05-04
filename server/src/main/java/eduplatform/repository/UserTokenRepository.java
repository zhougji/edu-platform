package eduplatform.repository;

import eduplatform.model.entity.User;
import eduplatform.model.entity.UserToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {
    Optional<UserToken> findByToken(String token);

    void deleteByUser(User user);
}