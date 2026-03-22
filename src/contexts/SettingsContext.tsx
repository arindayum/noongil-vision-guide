import React, { useState } from 'react';
import { X, Plus, Trash2, RotateCcw, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSettings, type AppSettings } from '@/contexts/SettingsContext';
import { useEmergencyContacts } from '@/hooks/useEmergencyContacts';
import { useLanguage, LANGUAGES, type AppLanguage } from '@/contexts/LanguageContext';
import { speak } from '@/utils/speech';

interface SettingsScreenProps {
  onClose: () => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { contacts, addContact, removeContact } = useEmergencyContacts();
  const { language, setLanguage } = useLanguage();

  // New contact form state
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const testSpeech = () => {
    speak('This is how I will sound with your current settings.', undefined);
  };

  const handleAddContact = () => {
    if (newName.trim() && newNumber.trim()) {
      addContact(newName, newNumber);
      setNewName('');
      setNewNumber('');
      setAddingContact(false);
    }
  };

  const fontSizeOptions: { value: AppSettings['fontSize']; label: string }[] = [
    { value: 'normal', label: 'Normal' },
    { value: 'large', label: 'Large' },
    { value: 'xlarge', label: 'X-Large' },
  ];

  const themeOptions: { value: AppSettings['theme']; label: string }[] = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'system', label: 'System' },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Settings</h1>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close settings">
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Language */}
        <Card>
          <CardHeader><CardTitle>Language</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label="Select language">
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={language.code === l.code}
                  onClick={() => setLanguage(l.code as AppLanguage)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    language.code === l.code
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Text Size */}
        <Card>
          <CardHeader><CardTitle>Text Size</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2" role="radiogroup" aria-label="Select text size">
              {fontSizeOptions.map(opt => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={settings.fontSize === opt.value}
                  onClick={() => updateSettings({ fontSize: opt.value })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    settings.fontSize === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Speech Rate */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Speech Rate
              <span className="text-sm font-normal text-muted-foreground">
                {settings.speechRate.toFixed(1)}×
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speechRate}
              onChange={e => updateSettings({ speechRate: parseFloat(e.target.value) })}
              className="w-full accent-primary"
              aria-label={`Speech rate: ${settings.speechRate.toFixed(1)} times normal speed`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Slow (0.5×)</span>
              <span>Fast (2.0×)</span>
            </div>
            <Button variant="outline" onClick={testSpeech} className="w-full">
              Test Speech
            </Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader><CardTitle>Theme</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2" role="radiogroup" aria-label="Select theme">
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={settings.theme === opt.value}
                  onClick={() => updateSettings({ theme: opt.value })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${
                    settings.theme === opt.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-secondary-foreground hover:bg-secondary-hover'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* High contrast toggle */}
            <label className="flex items-center justify-between cursor-pointer py-2">
              <span className="font-medium">High Contrast</span>
              <button
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  settings.highContrast ? 'bg-primary' : 'bg-border'
                }`}
                aria-label="Toggle high contrast mode"
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Auto-speak toggle */}
        <Card>
          <CardHeader><CardTitle>Behaviour</CardTitle></CardHeader>
          <CardContent>
            <label className="flex items-center justify-between cursor-pointer py-2">
              <div>
                <p className="font-medium">Auto-read results</p>
                <p className="text-sm text-muted-foreground">
                  Automatically read analysis aloud when done
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.autoSpeak}
                onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${
                  settings.autoSpeak ? 'bg-primary' : 'bg-border'
                }`}
                aria-label="Toggle auto-read results"
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    settings.autoSpeak ? 'translate-x-7' : 'translate-x-1'
                  }`}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Emergency Contacts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-destructive" />
              Emergency Contacts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className="flex items-center justify-between bg-muted rounded-xl px-4 py-3"
              >
                <div>
                  <p className="font-medium">{contact.name}</p>
                  <p className="text-sm text-muted-foreground">{contact.number}</p>
                </div>
                {contacts.length > 1 && (
                  <button
                    onClick={() => removeContact(contact.id)}
                    aria-label={`Remove ${contact.name}`}
                    className="text-destructive hover:text-destructive/80 p-2 transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}

            {addingContact ? (
              <div className="space-y-3 pt-2">
                <input
                  type="text"
                  placeholder="Contact name (e.g. Mum)"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-background border-2 border-input-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  aria-label="Emergency contact name"
                  autoFocus
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  className="w-full bg-background border-2 border-input-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  aria-label="Emergency contact phone number"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddContact} disabled={!newName.trim() || !newNumber.trim()} className="flex-1">
                    Save Contact
                  </Button>
                  <Button variant="outline" onClick={() => { setAddingContact(false); setNewName(''); setNewNumber(''); }}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setAddingContact(true)}
                className="w-full"
                aria-label="Add emergency contact"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Contact
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Reset */}
        <Card className="border-destructive/20">
          <CardContent className="pt-6">
            <Button
              variant="outline"
              onClick={resetSettings}
              className="w-full text-destructive border-destructive/30 hover:bg-destructive/5"
              aria-label="Reset all settings to defaults"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Reset to Defaults
            </Button>
          </CardContent>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default SettingsScreen;
