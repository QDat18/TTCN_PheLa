package com.example.be_phela.service;

import com.example.be_phela.interService.IContactService;
import com.example.be_phela.model.Contact;
import com.example.be_phela.repository.ContactRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class ContactService implements IContactService {
    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private EmailService emailService;

    @Override
    public Contact createContact(Contact contact) {
        Contact savedContact = contactRepository.save(contact);

        // Gửi email thông báo cho Admin và khách hàng (chạy ngầm Async)
        try {
            emailService.sendContactNotification(
                    savedContact.getFullName(),
                    savedContact.getEmail(),
                    savedContact.getContent()
            );
            emailService.sendAcknowledgmentEmail(
                    savedContact.getFullName(),
                    savedContact.getEmail()
            );
        } catch (Exception e) {
            // Không chặn tiến trình nếu gửi mail lỗi
            System.err.println("Lỗi gửi email liên hệ: " + e.getMessage());
        }

        return savedContact;
    }
}
