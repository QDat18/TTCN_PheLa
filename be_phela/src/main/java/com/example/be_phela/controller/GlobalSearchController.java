package com.example.be_phela.controller;

import com.example.be_phela.repository.BranchRepository;
import com.example.be_phela.repository.CustomerRepository;
import com.example.be_phela.repository.JobPostingRepository;
import com.example.be_phela.repository.OrderRepository;
import com.example.be_phela.repository.ProductRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/global-search")
public class GlobalSearchController {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final CustomerRepository customerRepository;
    private final JobPostingRepository jobPostingRepository;
    private final BranchRepository branchRepository;

    public GlobalSearchController(ProductRepository productRepository,
                                  OrderRepository orderRepository,
                                  CustomerRepository customerRepository,
                                  JobPostingRepository jobPostingRepository,
                                  BranchRepository branchRepository) {
        this.productRepository = productRepository;
        this.orderRepository = orderRepository;
        this.customerRepository = customerRepository;
        this.jobPostingRepository = jobPostingRepository;
        this.branchRepository = branchRepository;
    }

    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(GlobalSearchController.class);

    @GetMapping
    public ResponseEntity<Map<String, Object>> search(@RequestParam String query) {
        log.info("Received global search request for query: '{}'", query);
        Map<String, Object> results = new HashMap<>();

        try {
            // Search Products
            results.put("products", productRepository.findByProductNameContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query, PageRequest.of(0, 5)).getContent());

            // Search Orders
            results.put("orders", orderRepository.findByOrderCodeContainingIgnoreCase(query));

            // Search Customers
            results.put("customers", customerRepository.findByUsernameContainingIgnoreCaseOrEmailContainingIgnoreCaseOrFullnameContainingIgnoreCase(query, query, query));

            // Search Job Postings
            results.put("jobPostings", jobPostingRepository.findByTitleContainingIgnoreCaseOrDescriptionContainingIgnoreCase(query, query));

            // Search Branches
            results.put("branches", branchRepository.findByBranchNameContainingIgnoreCaseOrBranchCodeContainingIgnoreCaseOrAddressContainingIgnoreCase(query, query, query));

            log.info("Global search completed for query: '{}'. Found results in {} categories.", 
                query, results.values().stream().filter(v -> v instanceof java.util.Collection && !((java.util.Collection<?>)v).isEmpty()).count());
        } catch (Exception e) {
            log.error("Error during global search for query '{}': {}", query, e.getMessage());
            throw e;
        }

        return ResponseEntity.ok(results);
    }
}
