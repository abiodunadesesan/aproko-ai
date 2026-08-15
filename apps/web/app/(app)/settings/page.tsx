'use client';

import { useEffect, useMemo, useState } from 'react';
import { AppPageShell } from '@/components/app/app-page-shell';
import {
  AppFieldLabel,
  AppPageFrame,
  AppPanel,
  AppPanelBody,
  AppPanelHeader,
  appSurface,
} from '@/components/app/app-surface';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  getChatModelLabel,
  isChatModel,
  listChatModels,
  type ChatModel,
} from '@/lib/ai/chat-models';
import { DEFAULT_USER_PREFERENCES, type UserPreferences } from '@/lib/settings/preferences';
import { cn } from '@/lib/utils';

type MeResponse = {
  clerk_user_id: string;
  profile: {
    email: string | null;
    full_name: string | null;
    avatar_url: string | null;
    preferences?: UserPreferences | null;
  } | null;
  preferences?: UserPreferences;
};

const CHAT_MODEL_OPTIONS = listChatModels();

export default function SettingsPage() {
  const [me, setMe] = useState<MeResponse | null>(null);
  const [fullNameDraft, setFullNameDraft] = useState('');
  const [defaultChatModel, setDefaultChatModel] = useState<ChatModel>(
    DEFAULT_USER_PREFERENCES.defaultChatModel,
  );
  const [autoMemoryCapture, setAutoMemoryCapture] = useState(
    DEFAULT_USER_PREFERENCES.autoMemoryCapture,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingPrefs, setIsSavingPrefs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailText = useMemo(() => me?.profile?.email ?? 'Not available', [me]);

  function applyPreferences(preferences: UserPreferences | null | undefined) {
    const next = preferences ?? DEFAULT_USER_PREFERENCES;
    setDefaultChatModel(
      isChatModel(next.defaultChatModel)
        ? next.defaultChatModel
        : DEFAULT_USER_PREFERENCES.defaultChatModel,
    );
    setAutoMemoryCapture(Boolean(next.autoMemoryCapture));
  }

  async function loadMe() {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/v1/me');
      const payload = (await response.json()) as MeResponse | { error?: string };
      if (!response.ok || !('clerk_user_id' in payload)) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to load profile');
      }

      setMe(payload);
      setFullNameDraft(payload.profile?.full_name ?? '');
      applyPreferences(payload.preferences ?? payload.profile?.preferences ?? null);
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
      const payload = (await response.json()) as MeResponse | { error?: string };
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

  async function savePreferences() {
    setIsSavingPrefs(true);
    setError(null);
    setNotice(null);

    try {
      const response = await fetch('/api/v1/me', {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          preferences: {
            defaultChatModel,
            autoMemoryCapture,
          },
        }),
      });
      const payload = (await response.json()) as MeResponse | { error?: string };
      if (!response.ok || !('clerk_user_id' in payload)) {
        throw new Error((payload as { error?: string }).error ?? 'Failed to save preferences');
      }

      setMe(payload);
      applyPreferences(payload.preferences ?? payload.profile?.preferences ?? null);
      setNotice('AI preferences saved to your account.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save preferences');
    } finally {
      setIsSavingPrefs(false);
    }
  }

  useEffect(() => {
    void loadMe();
  }, []);

  return (
    <AppPageShell pageId="settings">
      <AppPageFrame>
        <div className="grid gap-5 sm:gap-6 lg:grid-cols-2">
          <AppPanel>
            <AppPanelHeader
              description="Update your display name used across Aproko AI."
              title="Profile"
            />
            <AppPanelBody className="space-y-4">
              {isLoading ? (
                <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading profile...</p>
              ) : null}

              <div className="space-y-1.5">
                <AppFieldLabel htmlFor="settings-email">Email</AppFieldLabel>
                <Input
                  className={appSurface.field}
                  disabled
                  id="settings-email"
                  value={emailText}
                />
              </div>

              <div className="space-y-1.5">
                <AppFieldLabel htmlFor="settings-full-name">Full Name</AppFieldLabel>
                <Input
                  className={appSurface.field}
                  id="settings-full-name"
                  onChange={(event) => setFullNameDraft(event.target.value)}
                  placeholder="Your full name"
                  value={fullNameDraft}
                />
              </div>

              <Button
                className="h-10 w-full rounded-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                disabled={isLoading || isSavingProfile}
                onClick={() => void saveProfile()}
                type="button"
              >
                {isSavingProfile ? 'Saving...' : 'Save Profile'}
              </Button>
            </AppPanelBody>
          </AppPanel>

          <AppPanel>
            <AppPanelHeader
              description="Saved to your account and used as the default model for new chats."
              title="AI Preferences"
            />
            <AppPanelBody className="space-y-4">
              <div className="space-y-1.5">
                <AppFieldLabel htmlFor="default-chat-model">Default Chat Model</AppFieldLabel>
                <select
                  className={cn(appSurface.field, 'appearance-none')}
                  id="default-chat-model"
                  onChange={(event) => {
                    if (isChatModel(event.target.value)) {
                      setDefaultChatModel(event.target.value);
                    }
                  }}
                  value={defaultChatModel}
                >
                  {CHAT_MODEL_OPTIONS.map((model) => (
                    <option key={model} value={model}>
                      {getChatModelLabel(model)}
                    </option>
                  ))}
                </select>
              </div>

              <label
                className={cn(
                  appSurface.inset,
                  'flex cursor-pointer items-start gap-3 p-3.5 text-sm text-zinc-700 dark:text-zinc-300',
                )}
                htmlFor="auto-memory-capture"
              >
                <input
                  checked={autoMemoryCapture}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-zinc-300 text-zinc-900 focus-visible:ring-2 focus-visible:ring-zinc-400 dark:border-zinc-600 dark:bg-zinc-950 dark:focus-visible:ring-zinc-600"
                  id="auto-memory-capture"
                  onChange={(event) => setAutoMemoryCapture(event.target.checked)}
                  type="checkbox"
                />
                <span>
                  Auto-capture preference and fact signals from chats. Explicit “remember that…”
                  requests still save even when this is off.
                </span>
              </label>

              <Button
                className="h-10 w-full rounded-full transition-transform hover:-translate-y-0.5 sm:w-auto"
                disabled={isLoading || isSavingPrefs}
                onClick={() => void savePreferences()}
                type="button"
              >
                {isSavingPrefs ? 'Saving...' : 'Save AI Preferences'}
              </Button>
            </AppPanelBody>
          </AppPanel>
        </div>

        {error ? (
          <div className={appSurface.alert} role="alert">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div className={appSurface.notice} role="status">
            {notice}
          </div>
        ) : null}
      </AppPageFrame>
    </AppPageShell>
  );
}
