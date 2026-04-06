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

const SETTINGS_STRINGS: Record<string, any> = {
  en: {
    title: 'Settings',
    language: 'Language',
    textSize: 'Text Size',
    speechRate: 'Speech Rate',
    testSpeech: 'Test Speech',
    theme: 'Theme',
    highContrast: 'High Contrast',
    behaviour: 'Behaviour',
    autoRead: 'Auto-read results',
    autoReadDesc: 'Automatically read analysis aloud when done',
    emergencyContacts: 'Emergency Contacts',
    addContact: 'Add Contact',
    saveContact: 'Save Contact',
    cancel: 'Cancel',
    reset: 'Reset to Defaults',
    testSpeechText: 'This is how I will sound with your current settings.',
    slow: 'Slow',
    fast: 'Fast',
    normal: 'Normal',
    large: 'Large',
    xlarge: 'X-Large',
    light: 'Light',
    dark: 'Dark',
    system: 'System'
  },
  hi: {
    title: 'सेटिंग्स',
    language: 'भाषा',
    textSize: 'टेक्स्ट का आकार',
    speechRate: 'बोलने की गति',
    testSpeech: 'आवाज जाँचें',
    theme: 'थीम',
    highContrast: 'हाई कंट्रास्ट',
    behaviour: 'व्यवहार',
    autoRead: 'परिणामों को स्वतः पढ़ें',
    autoReadDesc: 'विश्लेषण पूरा होने पर स्वतः ही बोलें',
    emergencyContacts: 'आपातकालीन संपर्क',
    addContact: 'संपर्क जोड़ें',
    saveContact: 'संपर्क सहेजें',
    cancel: 'रद्द करें',
    reset: 'डिफ़ॉल्ट पर रीसेट करें',
    testSpeechText: 'आपकी वर्तमान सेटिंग्स के साथ मैं इस तरह आवाज़ करूँगा।',
    slow: 'धीमा',
    fast: 'तेज़',
    normal: 'सामान्य',
    large: 'बड़ा',
    xlarge: 'बहुत बड़ा',
    light: 'लाइट',
    dark: 'डार्क',
    system: 'सिस्टम'
  },
  mr: {
    title: 'सेटिंग्ज',
    language: 'भाषा',
    textSize: 'मजकूर आकार',
    speechRate: 'बोलण्याचा वेग',
    testSpeech: 'आवाज तपासा',
    theme: 'थीम',
    highContrast: 'हाय कंट्रास्ट',
    behaviour: 'वर्तन',
    autoRead: 'निकाल स्वयंचलितपणे वाचा',
    autoReadDesc: 'विश्लेषण पूर्ण झाल्यावर स्वयंचलिटपणे वाचा',
    emergencyContacts: 'आणीबाणी संपर्क',
    addContact: 'संपर्क जोडा',
    saveContact: 'संपर्क जतन करा',
    cancel: 'रद्द करा',
    reset: 'डिफ़ॉल्टवर रीसेट करा',
    testSpeechText: 'तुमच्या सध्याच्या सेटिंग्जसह मी असे आवाज करेन.',
    slow: 'हळू',
    fast: 'जलद',
    normal: 'सामान्य',
    large: 'मोठा',
    xlarge: 'खूप मोठा',
    light: 'लाईट',
    dark: 'डार्क',
    system: 'सिस्टम'
  }
};

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onClose }) => {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { contacts, addContact, removeContact } = useEmergencyContacts();
  const { language, setLanguage } = useLanguage();

  const s = SETTINGS_STRINGS[language.code] || SETTINGS_STRINGS.en;

  // New contact form state
  const [newName, setNewName] = useState('');
  const [newNumber, setNewNumber] = useState('');
  const [addingContact, setAddingContact] = useState(false);

  const testSpeech = () => {
    speak(s.testSpeechText, undefined);
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
    { value: 'normal', label: s.normal },
    { value: 'large', label: s.large },
    { value: 'xlarge', label: s.xlarge },
  ];

  const themeOptions: { value: AppSettings['theme']; label: string }[] = [
    { value: 'light', label: s.light },
    { value: 'dark', label: s.dark },
    { value: 'system', label: s.system },
  ];

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-lg mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{s.title}</h1>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label={s.cancel}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        {/* Language */}
        <Card>
          <CardHeader><CardTitle>{s.language}</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-2 flex-wrap" role="radiogroup" aria-label={s.language}>
              {LANGUAGES.map(l => (
                <button
                  key={l.code}
                  role="radio"
                  aria-checked={language.code === l.code}
                  onClick={() => setLanguage(l.code as AppLanguage)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${language.code === l.code
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
          <CardHeader><CardTitle>{s.textSize}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2" role="radiogroup" aria-label={s.textSize}>
              {fontSizeOptions.map(opt => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={settings.fontSize === opt.value}
                  onClick={() => updateSettings({ fontSize: opt.value })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.fontSize === opt.value
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
              {s.speechRate}
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
              aria-label={`${s.speechRate}: ${settings.speechRate.toFixed(1)}`}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{s.slow} (0.5×)</span>
              <span>{s.fast} (2.0×)</span>
            </div>
            <Button variant="outline" onClick={testSpeech} className="w-full">
              {s.testSpeech}
            </Button>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader><CardTitle>{s.theme}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2" role="radiogroup" aria-label={s.theme}>
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  role="radio"
                  aria-checked={settings.theme === opt.value}
                  onClick={() => updateSettings({ theme: opt.value })}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-colors ${settings.theme === opt.value
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
              <span className="font-medium">{s.highContrast}</span>
              <button
                role="switch"
                aria-checked={settings.highContrast}
                onClick={() => updateSettings({ highContrast: !settings.highContrast })}
                className={`relative w-12 h-6 rounded-full transition-colors ${settings.highContrast ? 'bg-primary' : 'bg-border'
                  }`}
                aria-label={s.highContrast}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.highContrast ? 'translate-x-7' : 'translate-x-1'
                    }`}
                />
              </button>
            </label>
          </CardContent>
        </Card>

        {/* Auto-speak toggle */}
        <Card>
          <CardHeader><CardTitle>{s.behaviour}</CardTitle></CardHeader>
          <CardContent>
            <label className="flex items-center justify-between cursor-pointer py-2">
              <div>
                <p className="font-medium">{s.autoRead}</p>
                <p className="text-sm text-muted-foreground">
                  {s.autoReadDesc}
                </p>
              </div>
              <button
                role="switch"
                aria-checked={settings.autoSpeak}
                onClick={() => updateSettings({ autoSpeak: !settings.autoSpeak })}
                className={`relative w-12 h-6 rounded-full transition-colors shrink-0 ml-4 ${settings.autoSpeak ? 'bg-primary' : 'bg-border'
                  }`}
                aria-label={s.autoRead}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${settings.autoSpeak ? 'translate-x-7' : 'translate-x-1'
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
              {s.emergencyContacts}
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
                  placeholder="Contact name"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  className="w-full bg-background border-2 border-input-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  aria-label="Name"
                  autoFocus
                />
                <input
                  type="tel"
                  placeholder="Phone number"
                  value={newNumber}
                  onChange={e => setNewNumber(e.target.value)}
                  className="w-full bg-background border-2 border-input-border rounded-xl px-4 py-3 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-ring"
                  aria-label="Phone"
                />
                <div className="flex gap-2">
                  <Button onClick={handleAddContact} disabled={!newName.trim() || !newNumber.trim()} className="flex-1">
                    {s.saveContact}
                  </Button>
                  <Button variant="outline" onClick={() => { setAddingContact(false); setNewName(''); setNewNumber(''); }}>
                    {s.cancel}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setAddingContact(true)}
                className="w-full"
                aria-label={s.addContact}
              >
                <Plus className="mr-2 h-4 w-4" />
                {s.addContact}
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
              aria-label={s.reset}
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              {s.reset}
            </Button>
          </CardContent>
        </Card>

        <div className="h-8" />
      </div>
    </div>
  );
};

export default SettingsScreen;
