package eduplatform.service;

import eduplatform.model.dto.AuthResponse;
import eduplatform.model.dto.LoginRequest;
import eduplatform.model.dto.RegisterRequest;
import eduplatform.model.entity.User;
import eduplatform.model.entity.UserToken;
import eduplatform.repository.UserRepository;
import eduplatform.repository.UserTokenRepository;
import eduplatform.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Date;

@Service
public class AuthService {
    @Autowired
    private AuthenticationManager authenticationManager;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private UserTokenRepository userTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse login(LoginRequest loginRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        loginRequest.getUsername(),
                        loginRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        User user = userRepository.findByUsername(loginRequest.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found with username: " + loginRequest.getUsername()));

        // Save token to database
        saveUserToken(user, jwt);

        // Generate redirect URL based on user role
        String redirectUrl = generateRedirectUrl(user.getRole());

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().toString(),
                redirectUrl);
    }

    @Transactional
    public AuthResponse register(RegisterRequest registerRequest) {
        if (userRepository.existsByUsername(registerRequest.getUsername())) {
            throw new RuntimeException("Username is already taken!");
        }

        if (userRepository.existsByEmail(registerRequest.getEmail())) {
            throw new RuntimeException("Email is already in use!");
        }

        // Create new user
        User user = new User();
        user.setUsername(registerRequest.getUsername());
        user.setEmail(registerRequest.getEmail());
        user.setPassword(passwordEncoder.encode(registerRequest.getPassword()));
        user.setRole(User.UserRole.valueOf(registerRequest.getRole().toUpperCase()));

        userRepository.save(user);

        // Authenticate user and generate token
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(
                        registerRequest.getUsername(),
                        registerRequest.getPassword()));

        SecurityContextHolder.getContext().setAuthentication(authentication);
        String jwt = tokenProvider.generateToken(authentication);

        // Save token to database
        saveUserToken(user, jwt);

        // Generate redirect URL based on user role
        String redirectUrl = generateRedirectUrl(user.getRole());

        return new AuthResponse(
                jwt,
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().toString(),
                redirectUrl);
    }

    private void saveUserToken(User user, String token) {
        // 首先删除该用户的所有旧token
        userTokenRepository.deleteByUser(user);

        // 计算过期时间
        Date expiryDate = new Date(System.currentTimeMillis() + 86400000); // 24 hours

        // 创建新的token记录
        UserToken userToken = new UserToken();
        userToken.setUser(user);
        userToken.setToken(token);
        userToken.setExpiresAt(expiryDate);

        userTokenRepository.save(userToken);
    }

    private String generateRedirectUrl(User.UserRole role) {
        switch (role) {
            case STUDENT:
                return "/student-app";
            case TEACHER:
                return "/teacher-app";
            case ADMIN:
                return "/admin";
            default:
                return "/";
        }
    }
}