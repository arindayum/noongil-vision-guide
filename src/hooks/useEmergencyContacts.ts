import { useState, useCallback } from 'react';

export interface EmergencyContact {
  id: string;
  name: string;
  number: string;
}

const CONTACTS_KEY = 'noongil_emergency_contacts';
const DEFAULT_CONTACT: EmergencyContact = {
  id: 'default',
  name: 'Emergency Services',
  number: '112',
};

const load = (): EmergencyContact[] => {
  try {
    const raw = localStorage.getItem(CONTACTS_KEY);
    return raw ? JSON.parse(raw) : [DEFAULT_CONTACT];
  } catch {
    return [DEFAULT_CONTACT];
  }
};

const persist = (contacts: EmergencyContact[]) => {
  try {
    localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
  } catch {}
};

export const useEmergencyContacts = () => {
  const [contacts, setContacts] = useState<EmergencyContact[]>(load);

  const addContact = useCallback((name: string, number: string) => {
    const newContact: EmergencyContact = {
      id: crypto.randomUUID(),
      name: name.trim(),
      number: number.trim(),
    };
    setContacts(prev => {
      const updated = [...prev, newContact];
      persist(updated);
      return updated;
    });
  }, []);

  const removeContact = useCallback((id: string) => {
    // Prevent removing last contact
    setContacts(prev => {
      if (prev.length <= 1) return prev;
      const updated = prev.filter(c => c.id !== id);
      persist(updated);
      return updated;
    });
  }, []);

  const updateContact = useCallback((id: string, name: string, number: string) => {
    setContacts(prev => {
      const updated = prev.map(c =>
        c.id === id ? { ...c, name: name.trim(), number: number.trim() } : c
      );
      persist(updated);
      return updated;
    });
  }, []);

  return { contacts, addContact, removeContact, updateContact };
};
