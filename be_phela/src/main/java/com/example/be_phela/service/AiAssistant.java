package com.example.be_phela.service;

import dev.langchain4j.data.message.UserMessage;
import dev.langchain4j.service.MemoryId;

public interface AiAssistant {

    String chat(
        @MemoryId String customerId, 
        @dev.langchain4j.service.UserMessage dev.langchain4j.data.message.UserMessage userMessage
    );
}