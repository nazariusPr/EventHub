package org.eventhub.main.service.Impl;

import org.eventhub.main.exception.NullEntityReferenceException;
import org.eventhub.main.model.Event;
import org.eventhub.main.repository.EventRepository;
import org.eventhub.main.service.EventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;

@Service
public class EventServiceImpl implements EventService {

    @Autowired
    private EventRepository eventRepository;

    public EventServiceImpl(EventRepository eventRepository) {
        this.eventRepository = eventRepository;
    }


    @Override
    public Event create(Event event) {
        if(event != null) {
            return eventRepository.save(event);
        }
        throw new NullEntityReferenceException("Cannot save null event");
    }

    @Override
    public Event readById(long id) {
        return eventRepository.findById(id).orElseThrow( () -> new NullEntityReferenceException("Non existing id: " + id));
    }

    @Override
    public Event update(Event event) {
        if(event != null) {
            readById(event.getId());
            return eventRepository.save(event);
        }
        throw new NullEntityReferenceException("Cannot update null event");
    }

    @Override
    public void delete(long id) {
        eventRepository.delete(readById(id));
    }

    @Override
    public List<Event> getAll() {
        List<Event> events = eventRepository.findAll();
        return events.isEmpty() ? new ArrayList<>() : events;
    }
}
