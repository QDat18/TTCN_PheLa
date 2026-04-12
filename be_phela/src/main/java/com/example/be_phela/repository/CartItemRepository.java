package com.example.be_phela.repository;

import com.example.be_phela.model.Cart;
import com.example.be_phela.model.CartItem;
import com.example.be_phela.model.Product;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface CartItemRepository extends JpaRepository<CartItem, String> {
    Optional<CartItem> findByCartAndProduct(Cart cart, Product product);
}
