package com.example.be_phela.interService;

import com.example.be_phela.dto.request.CartItemDTO;
import com.example.be_phela.dto.response.CartResponseDTO;
import com.example.be_phela.model.Cart;
import com.example.be_phela.model.CartItem;

import java.util.List;

public interface ICartService {

    CartResponseDTO getCartByCustomerId(String customerId);
    void clearCartItems(String cartId);
    CartItem addOrUpdateCartItem(String cartId, CartItemDTO cartItemDTO);
    void removeCartItem(String cartId, String cartItemId);
    double calculateCartTotalFromItems(Cart cart);
    Integer countItemsInCart(String cartId);
    Double calculateShippingFee(String cartId);
    List<CartItemDTO> getCartItems(String cartId);
    void updateCartAddress(String cartId, String addressId);
    void updateCartBranch(String cartId, String branchCode);
    CartResponseDTO getCartByCartId(String cartId);
}