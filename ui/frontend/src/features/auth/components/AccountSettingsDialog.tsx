import { useState } from "react";
import type { FormEvent } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";

type RoleSettings = {
  api_key: string;
  base_url: string;
  model_name: string;
};

type ModelSettingsPayload = {
  retriever?: RoleSettings;
  generation?: RoleSettings;
};

type AccountSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "account" | "model";
  userLabel: string;
  initialNickname?: string | null;
  initialModelSettings?: Record<string, unknown> | null;
  isSubmitting?: boolean;
  statusMessage?: string;
  onSaveNickname: (nickname: string) => Promise<void>;
  onChangePassword: (payload: { current_password: string; new_password: string }) => Promise<void>;
  onSaveModelSettings: (payload: ModelSettingsPayload) => Promise<void>;
  onClearModelSettings: () => Promise<void>;
};

function parseRoleSettings(raw: unknown): RoleSettings {
  const source = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    api_key: String(source.api_key ?? ""),
    base_url: String(source.base_url ?? ""),
    model_name: String(source.model_name ?? ""),
  };
}

export function AccountSettingsDialog({
  open,
  onOpenChange,
  mode,
  userLabel,
  initialNickname,
  initialModelSettings,
  isSubmitting,
  statusMessage,
  onSaveNickname,
  onChangePassword,
  onSaveModelSettings,
  onClearModelSettings,
}: AccountSettingsDialogProps) {
  const initialSettings = (initialModelSettings ?? {}) as Record<string, unknown>;
  const [nickname, setNickname] = useState(() => String(initialNickname ?? ""));
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [retriever, setRetriever] = useState<RoleSettings>(() =>
    parseRoleSettings(initialSettings.retriever),
  );
  const [generation, setGeneration] = useState<RoleSettings>(() =>
    parseRoleSettings(initialSettings.generation),
  );
  const [localError, setLocalError] = useState("");

  const runAction = async (action: () => Promise<void>): Promise<boolean> => {
    setLocalError("");
    try {
      await action();
      return true;
    } catch (error) {
      setLocalError(error instanceof Error ? error.message : "Action failed, try again.");
      return false;
    }
  };

  const handleNicknameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction(() => onSaveNickname(nickname.trim()));
  };

  const handlePasswordSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLocalError("");
    if (!currentPassword || !newPassword || !confirmPassword) {
      setLocalError("Fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setLocalError("New passwords do not match.");
      return;
    }
    if (currentPassword === newPassword) {
      setLocalError("New password must differ from the current one.");
      return;
    }
    const saved = await runAction(() => onChangePassword({
      current_password: currentPassword,
      new_password: newPassword,
    }));
    if (!saved) return;
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const handleModelSettingsSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await runAction(() => onSaveModelSettings({
      retriever,
      generation,
    }));
  };

  const handleClearModelSettings = async () => {
    if (!await runAction(onClearModelSettings)) return;
    setRetriever(parseRoleSettings(null));
    setGeneration(parseRoleSettings(null));
  };

  const dialogTitle = mode === "model" ? "Model settings" : "Account settings";
  const dialogDescription = mode === "model" ? "Model parameters for the current user" : `Signed in as ${userLabel}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="account-dialog">
        <DialogHeader>
          <DialogTitle>{dialogTitle}</DialogTitle>
          <DialogDescription>{dialogDescription}</DialogDescription>
        </DialogHeader>

        {mode === "account" ? (
          <>
            <form className="account-form-section" onSubmit={handleNicknameSubmit}>
              <h4>Nickname</h4>
              <input
                className="auth-input"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder="Leave empty to clear"
                disabled={isSubmitting}
              />
              <div className="auth-actions">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  Save nickname
                </Button>
              </div>
            </form>

            <form className="account-form-section" onSubmit={handlePasswordSubmit}>
              <h4>Change password</h4>
              <input
                className="auth-input"
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <input
                className="auth-input"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                disabled={isSubmitting}
              />
              <div className="auth-actions">
                <Button type="submit" size="sm" disabled={isSubmitting}>
                  Update password
                </Button>
              </div>
            </form>
          </>
        ) : null}

        {mode === "model" ? (
          <form className="account-form-section" onSubmit={handleModelSettingsSubmit}>
            <h4>Model settings</h4>
            <div className="account-grid">
              <label className="auth-label">
                <span>Retriever API Key</span>
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="off"
                  value={retriever.api_key}
                  onChange={(event) =>
                    setRetriever((previous) => ({ ...previous, api_key: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <label className="auth-label">
                <span>Retriever Base URL</span>
                <input
                  className="auth-input"
                  value={retriever.base_url}
                  onChange={(event) =>
                    setRetriever((previous) => ({ ...previous, base_url: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <label className="auth-label">
                <span>Retriever Model</span>
                <input
                  className="auth-input"
                  value={retriever.model_name}
                  onChange={(event) =>
                    setRetriever((previous) => ({ ...previous, model_name: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <label className="auth-label">
                <span>Generation API Key</span>
                <input
                  className="auth-input"
                  type="password"
                  autoComplete="off"
                  value={generation.api_key}
                  onChange={(event) =>
                    setGeneration((previous) => ({ ...previous, api_key: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <label className="auth-label">
                <span>Generation Base URL</span>
                <input
                  className="auth-input"
                  value={generation.base_url}
                  onChange={(event) =>
                    setGeneration((previous) => ({ ...previous, base_url: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
              <label className="auth-label">
                <span>Generation Model</span>
                <input
                  className="auth-input"
                  value={generation.model_name}
                  onChange={(event) =>
                    setGeneration((previous) => ({ ...previous, model_name: event.target.value }))
                  }
                  disabled={isSubmitting}
                />
              </label>
            </div>
            <div className="auth-actions">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSubmitting}
                onClick={() => void handleClearModelSettings()}
              >
                Clear settings
              </Button>
              <Button type="submit" size="sm" disabled={isSubmitting}>
                Save model settings
              </Button>
            </div>
          </form>
        ) : null}

        {localError ? <p className="auth-error">{localError}</p> : null}
        {statusMessage ? <p className="auth-status">{statusMessage}</p> : null}
      </DialogContent>
    </Dialog>
  );
}
