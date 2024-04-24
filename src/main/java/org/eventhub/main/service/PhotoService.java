package org.eventhub.main.service;

import org.eventhub.main.dto.PhotoRequest;
import org.eventhub.main.dto.PhotoResponse;
import org.eventhub.main.model.Photo;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

public interface PhotoService {
    PhotoResponse create(PhotoRequest photoRequest);
    PhotoResponse readById(UUID id);
    Photo readByIdEntity(UUID id);
    PhotoResponse update(PhotoRequest photoRequest, UUID id);
    void deleteEventImage (UUID eventId, UUID imageId);
    void deleteProfileImage(UUID userId, UUID imageId);
    List<PhotoResponse> getAll();
    List<PhotoResponse> uploadEventPhotos(UUID eventId, List<MultipartFile> files);
    List<PhotoResponse> uploadProfilePhotos(UUID userId, List<MultipartFile> files);
}
