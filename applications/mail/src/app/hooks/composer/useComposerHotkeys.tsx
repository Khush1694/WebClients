import { MutableRefObject, RefObject, useRef } from 'react';

import { HotkeyTuple, useHotkeys } from '@proton/components';
import { isSafari as checkIsSafari } from '@proton/shared/lib/helpers/browser';
import { editorShortcuts } from '@proton/shared/lib/shortcuts/mail';
import noop from '@proton/utils/noop';

import { ExternalEditorActions } from '../../components/composer/editor/EditorWrapper';

export interface ComposerHotkeysHandlers {
    composerRef: RefObject<HTMLDivElement>;
    handleClose: () => Promise<void>;
    handleSend: () => Promise<void>;
    handleDelete: () => Promise<void>;
    handleManualSave: () => Promise<void>;
    toggleMinimized: () => void;
    toggleMaximized: () => void;
    handlePassword: () => void;
    handleExpiration: () => void;
    lock: boolean;
    saving: boolean;
    editorActionsRef: MutableRefObject<ExternalEditorActions | undefined>;
    hasHotkeysEnabled: boolean;
}

export const useComposerHotkeys = ({
    composerRef,
    handleClose,
    handleSend,
    handleDelete,
    handleManualSave,
    toggleMaximized,
    toggleMinimized,
    handlePassword,
    handleExpiration,
    lock,
    saving,
    editorActionsRef,
    hasHotkeysEnabled,
}: ComposerHotkeysHandlers) => {
    const isSafari = checkIsSafari();

    const attachmentTriggerRef = useRef<() => void>(noop);

    const keyHandlers = {
        close: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleClose();
        },
        send: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!lock) {
                await handleSend();
            }
        },
        delete: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            await handleDelete();
        },
        save: async (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            if (!saving && !lock) {
                await handleManualSave();
            }
        },
        minimize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMinimized();
        },
        maximize: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            toggleMaximized();
        },
        addAttachment: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            attachmentTriggerRef.current?.();
        },
        encrypt: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handlePassword();
        },
        addExpiration: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            handleExpiration();
        },
        linkModal: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            editorActionsRef.current?.showLinkModal();
        },
        emojiPicker: (e: KeyboardEvent) => {
            e.preventDefault();
            e.stopPropagation();
            editorActionsRef.current?.openEmojiPicker();
        },
    };

    const hotKeysActions: HotkeyTuple[] = hasHotkeysEnabled
        ? [
              [editorShortcuts.close, keyHandlers.close],
              [editorShortcuts.send, keyHandlers.send],
              [editorShortcuts.deleteDraft, keyHandlers.delete],
              [editorShortcuts.save, keyHandlers.save],
              [
                  editorShortcuts.minimize,
                  (e) => {
                      if (!isSafari) {
                          keyHandlers.minimize(e);
                      }
                  },
              ],
              [
                  editorShortcuts.maximize,
                  (e) => {
                      if (!isSafari) {
                          keyHandlers.maximize(e);
                      }
                  },
              ],
              [editorShortcuts.addAttachment, keyHandlers.addAttachment],
              [editorShortcuts.addEncryption, keyHandlers.encrypt],
              [editorShortcuts.addExpiration, keyHandlers.addExpiration],
              [editorShortcuts.addLink, keyHandlers.linkModal],
              [editorShortcuts.emojiPicker, keyHandlers.emojiPicker],
          ]
        : [];

    useHotkeys(composerRef, hotKeysActions);

    return attachmentTriggerRef;
};
