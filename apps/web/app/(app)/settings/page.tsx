'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '@/components/app/app-page-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

type MeProfile = {
  clerk_user_id: string;
  profile: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};

const STORAGE_KEYS = {
  defaultChatModel: 'aproko.settings.defaultChatModel',
  autoMemoryCapture: 'aproko.settings.autoMemoryCapture',
} as const;

export default function SettingsPage() {
  const [me, setMe] = useState<MeProfile | null>(null);
  const [fullNameDraft, setFullNameDraft] = useState('');
  const [defaultChatModel, setDefaultChatModel] = useState<'gpt-4.1-mini' | 'claude-3.5-sonnet'>(
    'gpt-4.1-mini',
  );
  const [autoMemoryCapture, setAutoMemoryCapture] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailText = useMemo(() => me?.profile?.email ?? 'Not available', [me]);

  async function loadMe() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/me');
      const payload = (await response.json()) as MeProfile | { error?: string };
      if (!response.ok || !('clerk_user_id' in payload)) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to load profile');
      }

      setMe(payload);
      setFullNameDraft(payload.profile?.full_name ?? '');
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'Failed to load profile');
      setMe(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function saveProfile() {
    setIsSavingProfile(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ full_name: fullNameDraft }),
      });
      const payload = (await response.json()) as MeProfile | { error?: string };
      if (!response.ok || !('clerk_user_id' in payload)) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to update profile');
      }

      setMe(payload);
      setNotice('Profile updated.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to update profile');
    } finally {
      setIsSavingProfile(false);
    }
  }

  function loadPreferenceDefaults() {
    if (typeof window === 'undefined') {
      return;
    }

    const storedModel = window.localStorage.getItem(STORAGE_KEYS.defaultChatModel);
    if (storedModel === 'gpt-4.1-mini' || storedModel === 'claude-3.5-sonnet') {
      setDefaultChatModel(storedModel);
    }

    const storedAutoMemoryCapture = window.localStorage.getItem(STORAGE_KEYS.autoMemoryCapture);
    if (storedAutoMemoryCapture === 'true' || storedAutoMemoryCapture === 'false') {
      setAutoMemoryCapture(storedAutoMemoryCapture === 'true');
    }
  }

  function savePreferences() {
    if (typeof window === 'undefined') {
      return;
    }

    setIsSavingPrefs(true);
    setError(null);
    setNotice(null);

    window.localStorage.setItem(STORAGE_KEYS.defaultChatModel, defaultChatModel);
    window.localStorage.setItem(STORAGE_KEYS.autoMemoryCapture, String(autoMemoryCapture));
    setNotice('AI preferences saved locally.');
    setIsSavingPrefs(false);
  }

  useEffect(() => {
    void loadMe();
    loadPreferenceDefaults();
  }, []);

  return (
    <AppPageShell pageId="settings">
      <section className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Update your display name used across Aproko AI.
              </p>
            </div>

            {isLoading ? <p className="text-sm text-muted-foreground">Loading profile...</p> : null}

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Email</span>
              <Input disabled value={emailText} />
            </label>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground">Full Name</span>
              <Input
                onChange={(event) => setFullNameDraft(event.target.value)}
                placeholder="Your full name"
                value={fullNameDraft}
              />
            </label>

            <Button
              className="transition-transform hover:-translate-y-0.5"
              disabled={isLoading || isSavingProfile}
              onClick={() => void saveProfile()}
              type="button"
            >
              {isSavingProfile ? 'Saving...' : 'Save Profile'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">
                Preferences for this workspace are saved in this browser.
              </p>
            </div>

            <label className="space-y-1">
              <span className="text-xs font-medium text-muted-foreground" id="default-model-label">
                Default Chat Model
              </span>
              <select
                aria-labelledby="default-model-label"
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                onChange={(event) =>
                  setDefaultChatModel(event.target.value as 'gpt-4.1-mini' | 'claude-3.5-sonnet')
                }
                value={defaultChatModel}
              >
                <option value="gpt-4.1-mini">GPT-4.1 Mini</option>
                <option value="claude-3.5-sonnet">Claude 3.5 Sonnet</option>
              </select>
            </label>

            <label className="flex items-center gap-2 text-sm" htmlFor="auto-memory-capture">
              <input
                id="auto-memory-capture"
                checked={autoMemoryCapture}
                onChange={(event) => setAutoMemoryCapture(event.target.checked)}
                type="checkbox"
              />
              <span>Auto-capture memory signals from chats</span>
            </label>

            <Button
              className="transition-transform hover:-translate-y-0.5"
              disabled={isSavingPrefs}
              onClick={savePreferences}
              type="button"
            >
              {isSavingPrefs ? 'Saving...' : 'Save AI Preferences'}
            </Button>
          </CardContent>
        </Card>
      </section>

      {error ? (
        <div
          className="mt-4 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      ) : null}
      {notice ? (
        <div
          className="mt-4 rounded-md border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-500/30 dark:bg-amber-950/40 dark:text-amber-200"
          role="status"
        >
          {notice}
        </div>
      ) : null}
    </AppPageShell>
  );
}
