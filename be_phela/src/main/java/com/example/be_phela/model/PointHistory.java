package com.example.be_phela.model;

import com.example.be_phela.model.enums.PointType;
import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UuidGenerator;

import java.time.LocalDateTime;

@Entity(name = "point_history")
public class PointHistory {
    @Id
    @UuidGenerator
    private String id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "customer_id", nullable = false)
    private Customer customer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id")
    private Order order;

    @Column(name = "note_amount", nullable = false)
    private Integer noteAmount;

    @Enumerated(EnumType.STRING)
    @Column(name = "type", nullable = false)
    private PointType type;

    @Column(name = "description")
    private String description;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    public PointHistory() {}

    // Getters and Setters
    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public Customer getCustomer() { return customer; }
    public void setCustomer(Customer customer) { this.customer = customer; }

    public Order getOrder() { return order; }
    public void setOrder(Order order) { this.order = order; }

    public Integer getNoteAmount() { return noteAmount; }
    public void setNoteAmount(Integer noteAmount) { this.noteAmount = noteAmount; }

    public PointType getType() { return type; }
    public void setType(PointType type) { this.type = type; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    // Manual Builder
    public static PointHistoryBuilder builder() {
        return new PointHistoryBuilder();
    }

    public static class PointHistoryBuilder {
        private Customer customer;
        private Order order;
        private Integer noteAmount;
        private PointType type;
        private String description;

        public PointHistoryBuilder customer(Customer customer) { this.customer = customer; return this; }
        public PointHistoryBuilder order(Order order) { this.order = order; return this; }
        public PointHistoryBuilder noteAmount(Integer noteAmount) { this.noteAmount = noteAmount; return this; }
        public PointHistoryBuilder type(PointType type) { this.type = type; return this; }
        public PointHistoryBuilder description(String description) { this.description = description; return this; }

        public PointHistory build() {
            PointHistory ph = new PointHistory();
            ph.setCustomer(customer);
            ph.setOrder(order);
            ph.setNoteAmount(noteAmount);
            ph.setType(type);
            ph.setDescription(description);
            return ph;
        }
    }
}
