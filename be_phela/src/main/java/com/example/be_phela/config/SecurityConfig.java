package com.example.be_phela.config;

import com.example.be_phela.security.AdminJwtAuthenticationFilter;
import com.example.be_phela.security.OAuth2SuccessHandler;
import com.example.be_phela.service.AdminUserDetailsService;
import com.example.be_phela.service.CustomerUserDetailsService;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.authentication.JwtGrantedAuthoritiesConverter;
import org.springframework.security.oauth2.server.resource.web.BearerTokenResolver;
import org.springframework.security.oauth2.server.resource.web.DefaultBearerTokenResolver;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import com.nimbusds.jwt.SignedJWT;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AdminUserDetailsService adminUserDetailsService;
    private final CustomerUserDetailsService customerUserDetailsService;
    private final OAuth2SuccessHandler oAuth2SuccessHandler;
    private final BCryptPasswordEncoder passwordEncoder;
    private final AdminJwtAuthenticationFilter adminJwtAuthenticationFilter;

    public SecurityConfig(AdminUserDetailsService adminUserDetailsService,
                          CustomerUserDetailsService customerUserDetailsService,
                          OAuth2SuccessHandler oAuth2SuccessHandler,
                          BCryptPasswordEncoder passwordEncoder,
                          AdminJwtAuthenticationFilter adminJwtAuthenticationFilter) {
        this.adminUserDetailsService = adminUserDetailsService;
        this.customerUserDetailsService = customerUserDetailsService;
        this.oAuth2SuccessHandler = oAuth2SuccessHandler;
        this.passwordEncoder = passwordEncoder;
        this.adminJwtAuthenticationFilter = adminJwtAuthenticationFilter;
    }

    @Bean
    @Primary
    public AuthenticationManager authenticationManager() {
        DaoAuthenticationProvider adminProvider = new DaoAuthenticationProvider();
        adminProvider.setUserDetailsService(adminUserDetailsService);
        adminProvider.setPasswordEncoder(passwordEncoder);
        adminProvider.setHideUserNotFoundExceptions(false);

        DaoAuthenticationProvider customerProvider = new DaoAuthenticationProvider();
        customerProvider.setUserDetailsService(customerUserDetailsService);
        customerProvider.setPasswordEncoder(passwordEncoder);
        customerProvider.setHideUserNotFoundExceptions(false);

        return new ProviderManager(adminProvider, customerProvider);
    }

    /**
     * Filter Chain chính:
     * - /api/admin/** : Được bảo vệ bởi AdminJwtAuthenticationFilter (JWT nội bộ do Backend phát hành khi login)
     * - /api/customer/** : Được bảo vệ bởi oauth2ResourceServer (Token Supabase)
     * - Các endpoint công khai: không cần xác thực
     */
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        return http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .formLogin(form -> form.disable())
            .httpBasic(httpBasic -> httpBasic.disable())
            .sessionManagement(session -> session
                    .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(registry -> {
                // Cho phép tất cả OPTIONS requests (CORS preflight)
                registry.requestMatchers(request -> "OPTIONS".equals(request.getMethod())).permitAll();

                // Các endpoint công khai
                registry.requestMatchers(
                        "/healthz", "/auth/admin/register", "/auth/customer/register",
                        "/auth/admin/login", "/auth/customer/login", "/auth/forgot-password/**",
                        "/auth/admin/forgot-password/**", "/verify", "/api/product/**",
                        "/api/categories/**", "/api/banner/**", "/api/banners/**",
                        "/api/contacts/**", "/api/applications/**", "/api/news/**",
                        "/api/job-postings/**", "/api/branch/**", "/api/vouchers/**",
                        "/api/ai/**", "/api/payment/payment-return", "/api/payment/payment-cancel",
                        "/api/payment/payos-webhook", "/api/webhooks/**", "/ws/**",
                        "/login/oauth2/**", "/oauth2/**", "/error"
                ).permitAll();

                // ===== CỬA ADMIN: dùng JWT nội bộ (được xác thực bởi AdminJwtAuthenticationFilter) =====
                registry.requestMatchers("/api/admin/**")
                        .hasAnyAuthority("ROLE_ADMIN", "ROLE_SUPER_ADMIN", "ROLE_STAFF");

                // ===== CỬA CUSTOMER: dùng Token Supabase (được xác thực bởi oauth2ResourceServer) =====
                registry.requestMatchers("/api/customer/**")
                        .hasAnyAuthority("ROLE_CUSTOMER", "ROLE_ADMIN", "ROLE_authenticated");

                registry.anyRequest().authenticated();
            })
            // OAuth2 browser login flow (dành cho Customer login bằng Google trên browser)
            .oauth2Login(oauth2 -> oauth2
                    .successHandler(oAuth2SuccessHandler)
            )
            // OAuth2 Resource Server: Xác thực Token Supabase cho /api/customer/**
            .oauth2ResourceServer(oauth2 -> oauth2
                    .bearerTokenResolver(bearerTokenResolver())
                    .jwt(jwt -> jwt.jwtAuthenticationConverter(jwtAuthenticationConverter()))
            )
            // Thêm AdminJwtAuthenticationFilter TRƯỚC UsernamePasswordAuthenticationFilter
            // Filter tự kiểm tra shouldNotFilter() - chỉ chạy cho /api/admin/**
            .addFilterBefore(adminJwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    /**
     * Bộ chuyển đổi JWT dành cho Supabase Token (Customer).
     * Đọc claim "role" và thêm prefix "ROLE_".
     */
    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtGrantedAuthoritiesConverter converter = new JwtGrantedAuthoritiesConverter();
        converter.setAuthoritiesClaimName("role");
        converter.setAuthorityPrefix("ROLE_");

        JwtAuthenticationConverter jwtConverter = new JwtAuthenticationConverter();
        jwtConverter.setJwtGrantedAuthoritiesConverter(converter);
        jwtConverter.setPrincipalClaimName("sub");
        return jwtConverter;
    }

    /**
     * Bộ phân giải Token Bearer:
     * Giúp hệ thống phân biệt được token của Admin (nội bộ) và token của Customer (Supabase).
     * Nếu token có issuer là "/", ResourceServer sẽ bỏ qua để AdminJwtAuthenticationFilter xử lý.
     */
    @Bean
    public BearerTokenResolver bearerTokenResolver() {
        DefaultBearerTokenResolver resolver = new DefaultBearerTokenResolver();
        return request -> {
            String token = resolver.resolve(request);
            if (token != null) {
                try {
                    SignedJWT signedJWT = SignedJWT.parse(token);
                    String issuer = signedJWT.getJWTClaimsSet().getIssuer();
                    if ("/".equals(issuer)) {
                        return null; // Bỏ qua đối với ResourceServer
                    }
                } catch (Exception e) {
                    // Token không hợp lệ hoặc format khác, để ResourceServer thử validate
                }
            }
            return token;
        };
    }
}