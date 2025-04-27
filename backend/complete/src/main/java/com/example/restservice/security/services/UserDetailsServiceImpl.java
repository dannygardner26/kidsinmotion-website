package com.example.restservice.security.services;

import com.example.restservice.model.User;
import com.example.restservice.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    @Autowired
    UserRepository userRepository;

    @Override
    @Transactional // Needed for fetching roles lazily if FetchType.LAZY is used on User.roles
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        // Load by email now, but keep the method name for Spring Security compatibility
        User user = userRepository.findByEmail(username) // Use findByEmail, parameter 'username' now holds the email
                .orElseThrow(() -> new UsernameNotFoundException("User Not Found with email: " + username));

        return UserDetailsImpl.build(user);
    }
}