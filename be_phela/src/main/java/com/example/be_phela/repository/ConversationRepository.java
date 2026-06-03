package com.example.be_phela.repository;

import com.example.be_phela.model.Conversation;
import com.example.be_phela.model.enums.ConversationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ConversationRepository extends JpaRepository<Conversation, String> {
    Optional<Conversation> findByCustomerIdAndStatusNot(String customerId, ConversationStatus status);
    List<Conversation> findByCustomerIdOrderByLastMessageAtDesc(String customerId);
    List<Conversation> findAllByOrderByLastMessageAtDesc();
    List<Conversation> findByStatusOrderByLastMessageAtDesc(ConversationStatus status);
}
