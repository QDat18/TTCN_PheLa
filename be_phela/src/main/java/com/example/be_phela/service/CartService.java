package com.example.be_phela.service;

import com.example.be_phela.dto.request.CartItemDTO;
import com.example.be_phela.dto.response.AddressDTO;
import com.example.be_phela.dto.response.BranchResponseDTO;
import com.example.be_phela.dto.response.CartResponseDTO;
import com.example.be_phela.interService.ICartService;
import com.example.be_phela.model.*;
import com.example.be_phela.repository.*; 
import com.example.be_phela.utils.DistanceCalculator;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class CartService implements ICartService {
    private static final Logger log = LoggerFactory.getLogger(CartService.class);

    private static final double BASE_SHIPPING_FEE = 10000.0;
    private static final double FEE_PER_KM = 2000.0;
    private static final double FREE_SHIPPING_THRESHOLD = 500000.0;

    private final CartRepository cartRepository;
    private final CustomerRepository customerRepository;
    private final ProductRepository productRepository;
    private final CartItemRepository cartItemRepository;
    private final AddressRepository addressRepository;
    private final BranchRepository branchRepository;
    private final ProductSizeRepository productSizeRepository;
    private final BranchService branchService;
    private final com.example.be_phela.mapper.ProductMapper productMapper;

    public CartService(CartRepository cartRepository, 
                       CustomerRepository customerRepository, 
                       ProductRepository productRepository, 
                       CartItemRepository cartItemRepository, 
                       AddressRepository addressRepository, 
                       BranchRepository branchRepository, 
                       ProductSizeRepository productSizeRepository, 
                       BranchService branchService, 
                       com.example.be_phela.mapper.ProductMapper productMapper) {
        this.cartRepository = cartRepository;
        this.customerRepository = customerRepository;
        this.productRepository = productRepository;
        this.cartItemRepository = cartItemRepository;
        this.addressRepository = addressRepository;
        this.branchRepository = branchRepository;
        this.productSizeRepository = productSizeRepository;
        this.branchService = branchService;
        this.productMapper = productMapper;
    }

    @Transactional
    public Cart createCartForCustomer(String customerId) {
        Optional<Cart> existingCart = cartRepository.findByCustomer_CustomerId(customerId);
        if (existingCart.isPresent()) {
            log.warn("Cart already exists for customer: {}. Returning existing cart.", customerId);
            return existingCart.get(); 
        }

        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Customer not found. Vui lòng đăng nhập lại hoặc chạy SQL đồng bộ Data. ID: " + customerId));

        Address defaultAddress = addressRepository.findByCustomer_CustomerIdAndIsDefaultTrue(customerId)
                .orElse(null);

        Optional<Branch> nearestBranch = Optional.empty();
        if (defaultAddress != null) {
            nearestBranch = branchService.findNearestBranch(defaultAddress, branchService.getAllBranches());
        }

        Cart cart = Cart.builder()
                .customer(customer)
                .address(defaultAddress)
                .branch(nearestBranch.orElse(null))
                .totalAmount(0.0)
                .cartItems(new ArrayList<>())
                .build();

        log.info("Creating cart for customer: {}", customerId);
        return cartRepository.save(cart); 
    }

    @Transactional
    public void synchronizeCartAddressAndBranch(String customerId) {
        Cart cart = cartRepository.findByCustomer_CustomerId(customerId)
                .orElseThrow(() -> new RuntimeException("Cart not found for customer: " + customerId));

        Address defaultAddress = addressRepository.findByCustomer_CustomerIdAndIsDefaultTrue(customerId)
                .orElse(null);

        if (defaultAddress != null) {
            cart.setAddress(defaultAddress);
            try {
                Optional<Branch> nearestBranch = branchService.findNearestBranch(defaultAddress, branchService.getAllBranches());
                cart.setBranch(nearestBranch.orElse(null));
            } catch (IllegalStateException e) {
                log.warn("No valid branch found for address: {}", defaultAddress.getAddressId());
                cart.setBranch(null);
            }
        } else {
            cart.setAddress(null);
            cart.setBranch(null);
        }

        log.info("Synchronizing address and branch for cart of customer: {}", customerId);
        cartRepository.save(cart); 
    }

    @Transactional
    @Override
    public CartResponseDTO getCartByCustomerId(String customerId) {
        Cart cart = cartRepository.findByCustomer_CustomerId(customerId)
                .orElseGet(() -> {
                    log.info("Cart not found for customer {}. Creating a new one.", customerId);
                    Customer customer = customerRepository.findById(customerId)
                            .orElseThrow(() -> new org.springframework.web.server.ResponseStatusException(org.springframework.http.HttpStatus.UNAUTHORIZED, "Customer not found. Vui lòng đăng nhập lại hoặc chạy SQL đồng bộ Data. ID: " + customerId));
                    Cart newCart = Cart.builder()
                            .customer(customer)
                            .totalAmount(0.0)
                            .cartItems(new ArrayList<>())
                            .build();
                    return cartRepository.save(newCart);
                });

        Address defaultAddress = addressRepository.findByCustomer_CustomerIdAndIsDefaultTrue(customerId)
                .orElse(null);
        if (defaultAddress != null && (cart.getAddress() == null || !cart.getAddress().getAddressId().equals(defaultAddress.getAddressId()))) {
            cart.setAddress(defaultAddress);
            try {
                Optional<Branch> nearestBranch = branchService.findNearestBranch(defaultAddress, branchService.getAllBranches());
                cart.setBranch(nearestBranch.orElse(null));
            } catch (Exception e) {
                log.warn("Could not find nearest branch for customer {}: {}", customerId, e.getMessage());
                cart.setBranch(null);
            }
            cartRepository.save(cart);
        } else if (defaultAddress == null && cart.getAddress() != null) {
            cart.setAddress(null);
            cart.setBranch(null);
            cartRepository.save(cart); 
        }

        return buildCartResponseDTO(cart);
    }

    @Override
    @Transactional
    public void clearCartItems(String cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        if (cart.getCartItems() != null) cart.getCartItems().clear();
        cart.setTotalAmount(0.0);
        log.info("Cleared items from cart: {}", cartId);
        cartRepository.save(cart); 
    }

    @Override
    @Transactional
    public CartItem addOrUpdateCartItem(String cartId, CartItemDTO cartItemDTO) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        Product product = productRepository.findById(cartItemDTO.getProductId())
                .orElseThrow(() -> new RuntimeException("Product not found with id: " + cartItemDTO.getProductId()));

        ProductSize productSize = null;
        if (cartItemDTO.getProductSizeId() != null && !cartItemDTO.getProductSizeId().isEmpty()) {
            productSize = productSizeRepository.findById(cartItemDTO.getProductSizeId())
                    .orElseThrow(() -> new RuntimeException("Product size not found with id: " + cartItemDTO.getProductSizeId()));
        }

        List<Product> toppings = new ArrayList<>();
        if (cartItemDTO.getToppingIds() != null) {
            for (String tid : cartItemDTO.getToppingIds()) {
                toppings.add(productRepository.findById(tid)
                        .orElseThrow(() -> new RuntimeException("Topping not found with id: " + tid)));
            }
        }

        final ProductSize finalProductSize = productSize;
        final List<Product> finalToppings = toppings;
        
        if (cart.getCartItems() == null) {
            cart.setCartItems(new ArrayList<>());
        }

        Optional<CartItem> existingItem = cart.getCartItems().stream()
                .filter(item -> item.getProduct().getProductId().equals(cartItemDTO.getProductId()) &&
                        (finalProductSize == null ? item.getProductSize() == null :
                                (item.getProductSize() != null && item.getProductSize().getProductSizeId().equals(finalProductSize.getProductSizeId()))) &&
                        isSameToppings(item.getToppings(), finalToppings))
                .findFirst();

        double baseUnitPrice = (productSize != null && productSize.getFinalPrice() != null) ? productSize.getFinalPrice() : 
                               (product.getOriginalPrice() != null ? product.getOriginalPrice() : 0.0);
        double totalToppingPrice = toppings.stream()
                .mapToDouble(p -> p.getOriginalPrice() != null ? p.getOriginalPrice() : 0.0)
                .sum();
        double unitPrice = baseUnitPrice + totalToppingPrice;

        CartItem cartItem;
        if (existingItem.isPresent()) {
            cartItem = existingItem.get();
            if (cartItemDTO.getQuantity() <= 0) {
                cart.getCartItems().remove(cartItem);
            } else {
                cartItem.setQuantity(cartItemDTO.getQuantity());
                cartItem.setAmount(unitPrice * cartItemDTO.getQuantity());
                cartItem.setNote(cartItemDTO.getNote());
                cartItem.setToppings(toppings); 
            }
        } else {
            if (cartItemDTO.getQuantity() <= 0) {
                throw new IllegalArgumentException("Cannot add an item with quantity 0 or less.");
            }
            cartItem = CartItem.builder()
                    .cart(cart)
                    .product(product)
                    .productSize(productSize)
                    .quantity(cartItemDTO.getQuantity())
                    .amount(unitPrice * cartItemDTO.getQuantity())
                    .note(cartItemDTO.getNote())
                    .toppings(toppings)
                    .build();
            cart.getCartItems().add(cartItem);
        }

        cart.setTotalAmount(calculateCartTotalFromItems(cart));
        log.info("Added/Updated item in cart: {}. Product: {}, Size: {}, Quantity: {}",
                cartId, cartItemDTO.getProductId(), cartItemDTO.getProductSizeId(), cartItemDTO.getQuantity());
        cartRepository.save(cart);
        return cartItem;
    }

    @Override
    @Transactional
    public void removeCartItem(String cartId, String cartItemId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));

        CartItem itemToRemove = cartItemRepository.findById(cartItemId)
                .orElseThrow(() -> new RuntimeException("Cart item not found with id: " + cartItemId));

        if (!itemToRemove.getCart().getCartId().equals(cartId)) {
            throw new RuntimeException("Cart item does not belong to this cart");
        }

        if (cart.getCartItems() != null) {
            cart.getCartItems().remove(itemToRemove);
        }
        cart.setTotalAmount(calculateCartTotalFromItems(cart));
        log.info("Removed item from cart: {}. Cart item: {}", cartId, cartItemId);
        cartRepository.save(cart); 
    }

    private double calculateShippingFee(Cart cart, double distance) {
        double totalAmount = calculateCartTotalFromItems(cart);
        if (totalAmount >= FREE_SHIPPING_THRESHOLD) { 
            return 0.0;
        }

        Address address = cart.getAddress();
        Branch branch = cart.getBranch();

        if (address == null || branch == null ||
                address.getLatitude() == null || address.getLongitude() == null ||
                branch.getLatitude() == null || branch.getLongitude() == null) {
            return BASE_SHIPPING_FEE; 
        }

        return Math.floor(BASE_SHIPPING_FEE + (distance * FEE_PER_KM)); 
    }

    public double calculateCartTotalFromItems(Cart cart) {
        if (cart.getCartItems() == null) return 0.0;
        return cart.getCartItems().stream()
                .mapToDouble(CartItem::getAmount)
                .sum();
    }

    private boolean isSameToppings(List<Product> list1, List<Product> list2) {
        if (list1 == null && list2 == null) return true;
        if (list1 == null || list2 == null) return false;
        if (list1.size() != list2.size()) return false;
        List<String> ids1 = list1.stream().map(Product::getProductId).sorted().collect(Collectors.toList());
        List<String> ids2 = list2.stream().map(Product::getProductId).sorted().collect(Collectors.toList());
        return ids1.equals(ids2);
    }

    @Transactional(readOnly = true)
    @Override
    public Integer countItemsInCart(String cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        if (cart.getCartItems() == null) return 0;
        return cart.getCartItems().stream()
                .mapToInt(CartItem::getQuantity)
                .sum();
    }

    private double calculateDistanceForCart(Cart cart) {
        double distance = 0.0;
        Address address = cart.getAddress();
        Branch branch = cart.getBranch();

        if (address != null && branch != null &&
                address.getLatitude() != null && address.getLongitude() != null &&
                branch.getLatitude() != null && branch.getLongitude() != null) {
            distance = DistanceCalculator.calculateDistance(
                    address.getLatitude(), address.getLongitude(),
                    branch.getLatitude(), branch.getLongitude()
            );
        }
        return distance;
    }

    @Override
    @Transactional
    public Double calculateShippingFee(String cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));

        double distance = calculateDistanceForCart(cart);
        return calculateShippingFee(cart, distance);
    }

    @Transactional
    @Override
    public List<CartItemDTO> getCartItems(String cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        if (cart.getCartItems() == null) return new ArrayList<>();
        return cart.getCartItems().stream()
                .map(item -> CartItemDTO.builder()
                        .cartItemId(item.getCartItemId())
                        .productId(item.getProduct().getProductId())
                        .productSizeId(item.getProductSize() != null ? item.getProductSize().getProductSizeId() : null)
                        .productSizeName(item.getProductSize() != null ? item.getProductSize().getSizeName() : "PHÊ")
                        .quantity(item.getQuantity())
                        .amount(item.getAmount())
                        .note(item.getNote())
                        .selectedToppings(item.getToppings() != null ?
                                item.getToppings().stream().map(productMapper::toProductResponseDTO).collect(Collectors.toList()) :
                                new ArrayList<>())
                        .build())
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void updateCartAddress(String cartId, String addressId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        Address address = addressRepository.findById(addressId)
                .orElseThrow(() -> new RuntimeException("Address not found with id: " + addressId));

        if (!address.getCustomer().getCustomerId().equals(cart.getCustomer().getCustomerId())) {
            throw new RuntimeException("Address does not belong to this customer");
        }

        cart.setAddress(address);

        try {
            Optional<Branch> nearestBranch = branchService.findNearestBranch(address, branchService.getAllBranches());
            cart.setBranch(nearestBranch.orElse(null));
        } catch (IllegalStateException e) {
            throw new RuntimeException("No valid branch found for the address", e);
        }

        log.info("Updated address {} for cart {}", addressId, cartId);
        cartRepository.save(cart); 
    }

    @Override
    @Transactional
    public void updateCartBranch(String cartId, String branchCode) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Cart not found with id: " + cartId));
        Branch branch = branchRepository.findById(branchCode)
                .orElseThrow(() -> new RuntimeException("Branch not found with code: " + branchCode));

        cart.setBranch(branch);
        log.info("Updated branch {} for cart {}", branchCode, cartId);
        cartRepository.save(cart); 
    }

    @Override
    public CartResponseDTO getCartByCartId(String cartId) {
        Cart cart = cartRepository.findById(cartId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy giỏ hàng với ID: " + cartId));

        return buildCartResponseDTO(cart);
    }

    private CartResponseDTO buildCartResponseDTO(Cart cart) {
        double totalAmount = calculateCartTotalFromItems(cart);

        double distance = calculateDistanceForCart(cart);
        double shippingFee = calculateShippingFee(cart, distance); 
        double finalAmount = totalAmount + shippingFee;

        AddressDTO addressDTO = cart.getAddress() != null ? AddressDTO.builder()
                .addressId(cart.getAddress().getAddressId())
                .city(cart.getAddress().getCity())
                .district(cart.getAddress().getDistrict())
                .ward(cart.getAddress().getWard())
                .recipientName(cart.getAddress().getRecipientName())
                .phone(cart.getAddress().getPhone())
                .detailedAddress(cart.getAddress().getDetailedAddress())
                .latitude(cart.getAddress().getLatitude())
                .longitude(cart.getAddress().getLongitude())
                .isDefault(cart.getAddress().getIsDefault())
                .build() : null;

        BranchResponseDTO branchDTO = cart.getBranch() != null ? BranchResponseDTO.builder()
                .branchCode(cart.getBranch().getBranchCode())
                .branchName(cart.getBranch().getBranchName())
                .latitude(cart.getBranch().getLatitude())
                .longitude(cart.getBranch().getLongitude())
                .city(cart.getBranch().getCity())
                .district(cart.getBranch().getDistrict())
                .address(cart.getBranch().getAddress())
                .status(cart.getBranch().getStatus())
                .build() : null;

        return CartResponseDTO.builder()
                .cartId(cart.getCartId())
                .customerId(cart.getCustomer().getCustomerId())
                .addressId(cart.getAddress() != null ? cart.getAddress().getAddressId() : null)
                .address(addressDTO)
                .branchCode(cart.getBranch() != null ? cart.getBranch().getBranchCode() : null)
                .branch(branchDTO)
                .createdAt(cart.getCreatedAt())
                .updatedAt(cart.getUpdatedAt())
                .cartItems(cart.getCartItems() != null ? cart.getCartItems().stream()
                        .map(item -> CartItemDTO.builder()
                                .cartItemId(item.getCartItemId())
                                .productId(item.getProduct() != null ? item.getProduct().getProductId() : "UNKNOWN")
                                .productSizeId(item.getProductSize() != null ? item.getProductSize().getProductSizeId() : null)
                                .productSizeName(item.getProductSize() != null ? item.getProductSize().getSizeName() : "PHÊ")
                                .quantity(item.getQuantity())
                                .amount(item.getAmount())
                                .note(item.getNote())
                                .selectedToppings(item.getToppings() != null ?
                                        item.getToppings().stream().map(productMapper::toProductResponseDTO).collect(Collectors.toList()) :
                                        new ArrayList<>())
                                .build())
                        .collect(Collectors.toList()) : new ArrayList<>())
                .distance(distance)
                .totalAmount(totalAmount)
                .shippingFee(shippingFee)
                .finalAmount(finalAmount)
                .build();
    }
}