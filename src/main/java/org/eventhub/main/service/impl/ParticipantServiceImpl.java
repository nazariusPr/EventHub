package org.eventhub.main.service.impl;

import jakarta.persistence.EntityNotFoundException;
import org.eventhub.main.dto.ParticipantRequest;
import org.eventhub.main.dto.ParticipantResponse;
import org.eventhub.main.exception.AccessIsDeniedException;
import org.eventhub.main.exception.NullDtoReferenceException;
import org.eventhub.main.exception.NullEntityReferenceException;
import org.eventhub.main.mapper.ParticipantMapper;
import org.eventhub.main.model.Event;
import org.eventhub.main.model.Participant;
import org.eventhub.main.repository.EventRepository;
import org.eventhub.main.repository.ParticipantRepository;
import org.eventhub.main.service.EventService;
import org.eventhub.main.service.ParticipantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class ParticipantServiceImpl implements ParticipantService {


    private final ParticipantRepository participantRepository;
    private final ParticipantMapper participantMapper;
    private final EventService eventService;

    @Autowired
    public ParticipantServiceImpl(ParticipantRepository participantRepository, ParticipantMapper participantMapper, EventRepository eventRepository, EventService eventService) {
        this.participantRepository = participantRepository;
        this.participantMapper = participantMapper;
        this.eventService = eventService;
    }


    @Override
    public ParticipantResponse create(ParticipantRequest participantRequest) {
        Event event = eventService.readByIdEntity(participantRequest.getEventId());

        if (event.getParticipantCount() >= event.getMaxParticipants()) {
            throw new AccessIsDeniedException("Event " + event.getTitle() + " is full.");
        }

        for (Participant participant1 : event.getParticipants()) {
            if (participant1.getUser().getId().equals(participantRequest.getUserId())) {
                throw new AccessIsDeniedException("Duplicate join-request for " + event.getTitle());
            }
        }

        Participant participant = participantMapper.requestToEntity(participantRequest, new Participant());
        participant.setCreatedAt(LocalDateTime.now());
        participant.setApproved(false);

        return participantMapper.entityToResponse( participantRepository.save(participant));
    }

    @Override
    public ParticipantResponse addParticipant(UUID participantId) {
        Participant existingParticipant = readByIdEntity(participantId);

        Event event = existingParticipant.getEvent();

        if (event.getParticipantCount() >= event.getMaxParticipants()) {
            throw new AccessIsDeniedException("Event " + event.getTitle() + " is full.");
        }
        System.out.println("Participant count: " + event.getParticipantCount());
        event.setParticipantCount(event.getParticipantCount() + 1);
        System.out.println("Participant count: " + event.getParticipantCount());
        existingParticipant.setApproved(true);

        return participantMapper.entityToResponse(participantRepository.save(existingParticipant));
    }

    @Override
    public ParticipantResponse readById(UUID id) {
        Participant participant = participantRepository.findById(id)
                .orElseThrow(()->new EntityNotFoundException("Participant with " + id + " id is not found"));
        return participantMapper.entityToResponse(participant);
    }

    @Override
    public Participant readByIdEntity(UUID id){
        return participantRepository.findById(id)
                .orElseThrow(()->new EntityNotFoundException("Participant with" + id + " id is not found"));
    }
    @Override
    public ParticipantResponse update(ParticipantRequest participantRequest, UUID id) {
        if(participantRequest != null){
            Participant existingParticipant = readByIdEntity(id);
            Participant participant = participantMapper.requestToEntity(participantRequest, existingParticipant);
            participant = participantRepository.save(participant);
            return participantMapper.entityToResponse(participant);
        }
        throw new NullDtoReferenceException("Request can't be null");
    }

    public void delete(UUID id) {
        Participant participant = readByIdEntity(id);

        Event event = eventService.readByIdEntity(participant.getEvent().getId());
        event.setParticipantCount(event.getParticipantCount() - 1);

        participantRepository.delete(readByIdEntity(id));
    }

    @Override
    public List<ParticipantResponse> getAll() {
        return participantRepository.findAll()
                .stream()
                .map(participantMapper::entityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParticipantResponse> getAllByEventId(UUID eventId) {
        Event event = eventService.readByIdEntity(eventId);
        return event.getParticipants()
                .stream()
                .filter(Participant::isApproved)
                .map(participantMapper::entityToResponse)
                .collect(Collectors.toList());
    }

    @Override
    public List<ParticipantResponse> getAllRequestsByEventId(UUID eventId) {
        Event event = eventService.readByIdEntity(eventId);
        return event.getParticipants()
                .stream()
                .filter(participant -> !participant.isApproved())
                .map(participantMapper::entityToResponse)
                .collect(Collectors.toList());
    }

}