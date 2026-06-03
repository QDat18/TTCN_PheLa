package com.example.be_phela.config;

import com.nimbusds.jose.JWSVerifier;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.SignedJWT;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessageDeliveryException;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Collection;
import java.util.Date;
import java.util.List;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private static final Logger log = LoggerFactory.getLogger(WebSocketConfig.class);

    @Value("${jwt.signer-key}")
    private String signerKey;

    private final JwtDecoder jwtDecoder;
    private final com.example.be_phela.repository.ConversationRepository conversationRepository;

    public WebSocketConfig(JwtDecoder jwtDecoder, com.example.be_phela.repository.ConversationRepository conversationRepository) {
        this.jwtDecoder = jwtDecoder;
        this.conversationRepository = conversationRepository;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                    "http://localhost:3000", 
                    "http://localhost:3001", 
                    "http://localhost:3002", 
                    "http://localhost:5173", 
                    "https://*.onrender.com"
                )
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(@org.springframework.lang.NonNull Message<?> message, @org.springframework.lang.NonNull MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                        log.warn("WebSocket connection attempt missing or invalid Authorization header");
                        throw new MessageDeliveryException("Unauthorized: Missing token");
                    }

                    String token = authHeader.substring(7);
                    try {
                        SignedJWT signedJWT = SignedJWT.parse(token);
                        String issuer = signedJWT.getJWTClaimsSet().getIssuer();

                        if ("/".equals(issuer)) {
                            // Admin JWT
                            JWSVerifier verifier = new MACVerifier(signerKey.getBytes());
                            if (!signedJWT.verify(verifier)) {
                                throw new MessageDeliveryException("Unauthorized: Invalid Admin signature");
                            }

                            Date expirationTime = signedJWT.getJWTClaimsSet().getExpirationTime();
                            if (expirationTime != null && expirationTime.before(new Date())) {
                                throw new MessageDeliveryException("Unauthorized: Expired Admin token");
                            }

                            String username = signedJWT.getJWTClaimsSet().getSubject();
                            String role = (String) signedJWT.getJWTClaimsSet().getClaim("role");
                            String authority = (role != null) ? "ROLE_" + role : "ROLE_ADMIN";

                            UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                                    username,
                                    null,
                                    List.of(new SimpleGrantedAuthority(authority))
                            );
                            accessor.setUser(authToken);
                            log.info("WebSocket authenticated Admin: " + username);
                        } else {
                            // Customer (Supabase) JWT
                            Jwt jwt = jwtDecoder.decode(token);
                            JwtGrantedAuthoritiesConverter authoritiesConverter = new JwtGrantedAuthoritiesConverter();
                            authoritiesConverter.setAuthoritiesClaimName("role");
                            authoritiesConverter.setAuthorityPrefix("ROLE_");
                            
                            Collection<org.springframework.security.core.GrantedAuthority> authorities = 
                                    authoritiesConverter.convert(jwt);
                            
                            JwtAuthenticationToken authToken = new JwtAuthenticationToken(jwt, authorities, jwt.getClaim("sub"));
                            accessor.setUser(authToken);
                            log.info("WebSocket authenticated Customer: " + jwt.getClaim("sub"));
                        }
                    } catch (Exception e) {
                        log.warn("WebSocket authentication failed: " + e.getMessage());
                        throw new MessageDeliveryException("Unauthorized: " + e.getMessage());
                    }
                }
                
                if (accessor != null && StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
                    String destination = accessor.getDestination();
                    if (destination != null) {
                        java.security.Principal principal = accessor.getUser();
                        if (principal == null) {
                            throw new MessageDeliveryException("Unauthorized: No authenticated user");
                        }
                        
                        org.springframework.security.core.Authentication auth = (org.springframework.security.core.Authentication) principal;
                        boolean isAdmin = auth.getAuthorities().stream()
                                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN") || 
                                               a.getAuthority().equals("ROLE_SUPER_ADMIN") || 
                                               a.getAuthority().equals("ROLE_STAFF"));

                        // Restrict /topic/conversations/{conversationId}
                        if (destination.startsWith("/topic/conversations/")) {
                            String conversationId = destination.substring("/topic/conversations/".length());
                            java.util.Optional<com.example.be_phela.model.Conversation> convOpt = conversationRepository.findById(conversationId);
                            if (convOpt.isPresent()) {
                                com.example.be_phela.model.Conversation conv = convOpt.get();
                                if (!isAdmin && !conv.getCustomerId().equals(auth.getName())) {
                                    log.warn("Access Denied: Customer {} tried to subscribe to conversation {}", auth.getName(), conversationId);
                                    throw new MessageDeliveryException("Access denied: You do not own this conversation");
                                }
                            } else {
                                log.warn("Access Denied: Conversation {} not found", conversationId);
                                throw new MessageDeliveryException("Access denied: Conversation not found");
                            }
                        }
                        
                        // Restrict admin topics
                        if (destination.startsWith("/topic/admin/")) {
                            if (!isAdmin) {
                                log.warn("Access Denied: Non-admin {} tried to subscribe to admin topic {}", auth.getName(), destination);
                                throw new MessageDeliveryException("Access denied: Admin role required");
                            }
                        }
                    }
                }
                
                return message;
            }
        });
    }
}
