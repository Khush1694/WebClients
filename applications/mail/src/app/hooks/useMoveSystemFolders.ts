import { useEffect, useMemo, useRef, useState } from 'react';

import { FeatureCode, IconName, useApi, useFeature } from '@proton/components';
import { useSystemFolders } from '@proton/components/hooks/useCategories';
import { orderSystemFolders, updateSystemFolders } from '@proton/shared/lib/api/labels';
import { ACCENT_COLORS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { MailSettings } from '@proton/shared/lib/interfaces';

import { getDefaultSytemFolders, getSidebarNavItems, moveSystemFolders } from './useMoveSystemFolders.helpers';

export interface UseMoveSystemFoldersProps {
    showMoved: MailSettings['ShowMoved'];
    showScheduled: boolean;
}

export enum SYSTEM_FOLDER_SECTION {
    MAIN = 1,
    MORE = 0,
}

export interface SystemFolderPayload {
    ID: MAILBOX_LABEL_IDS;
    Order: number;
    Display: SYSTEM_FOLDER_SECTION;
    /** Mandatory for "update" api call */
    Color: string;
    /** Mandatory for "update" api call */
    Name: string;
}

export interface BaseSystemFolder {
    labelID: MAILBOX_LABEL_IDS;
    ID: string;
    icon: IconName;
    text: string;
    shortcutText?: string;
    visible: boolean;
    order: number;
    display: SYSTEM_FOLDER_SECTION;
}

export interface SystemFolder extends BaseSystemFolder {
    /** Mandatory fields for api calls */
    payloadExtras: {
        Name: SystemFolderPayload['Color'];
        Color: SystemFolderPayload['Name'];
    };
}

type UseSidebarElementsResponse = [
    sidebarElements: SystemFolder[],
    moveSidebarElements: (draggedId: MAILBOX_LABEL_IDS, droppedId: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM') => void,
    loading: boolean
];

const useMoveSystemFolders = ({
    showMoved = 0,
    showScheduled,
}: UseMoveSystemFoldersProps): UseSidebarElementsResponse => {
    const api = useApi();
    const abortUpdateOrderCallRef = useRef<AbortController>(new AbortController());
    const [systemFoldersFromApi, loading] = useSystemFolders();
    const reorderSystemFoldersFeature = useFeature(FeatureCode.ReorderSystemFolders);
    const canReorderSystemFolders = reorderSystemFoldersFeature.feature?.Value === true;

    const [systemFolders, setSystemFolders] = useState<SystemFolder[]>([]);
    const visibleSystemFolders = useMemo(() => systemFolders.filter((element) => element.visible), [systemFolders]);

    const moveItem = (draggedID: MAILBOX_LABEL_IDS, droppedID: MAILBOX_LABEL_IDS | 'MORE_FOLDER_ITEM') => {
        if (draggedID === droppedID) {
            return;
        }

        const nextItems = moveSystemFolders(draggedID, droppedID, systemFolders);

        // Optimistic update
        setSystemFolders(nextItems);

        const prevDraggedItem = systemFolders.find((item) => item.labelID === draggedID);
        const nextDraggedItem = nextItems.find((item) => item.labelID === draggedID);

        if (!prevDraggedItem || !nextDraggedItem) {
            return;
        }

        const hasSectionChanged =
            prevDraggedItem.display !== undefined &&
            nextDraggedItem.display !== undefined &&
            nextDraggedItem.display !== prevDraggedItem.display;

        // Abort prev requests
        abortUpdateOrderCallRef.current.abort();
        abortUpdateOrderCallRef.current = new AbortController();

        if (hasSectionChanged) {
            void api({
                ...updateSystemFolders(nextDraggedItem.labelID, {
                    Display: nextDraggedItem.display,
                    Color: nextDraggedItem.payloadExtras.Color,
                    Name: nextDraggedItem.payloadExtras.Name,
                }),
            });
        }

        void api({
            ...orderSystemFolders({ LabelIDs: nextItems.map((item) => item.labelID) }),
            signal: abortUpdateOrderCallRef.current.signal,
        });
    };

    useEffect(() => {
        if (systemFoldersFromApi?.length && canReorderSystemFolders === true) {
            const labels = systemFoldersFromApi || [];
            const formattedLabels: SystemFolderPayload[] = labels
                .map((label) => ({
                    ID: label.ID as MAILBOX_LABEL_IDS,
                    Display: label.Display ?? SYSTEM_FOLDER_SECTION.MAIN,
                    Order: label.Order,
                    Color: label.Color,
                    Name: label.Name,
                }))
                .filter((item) => !!item.ID);

            const formattedSystemFolders = getSidebarNavItems(showMoved, showScheduled, formattedLabels);
            setSystemFolders(formattedSystemFolders);
        }
    }, [systemFoldersFromApi, showScheduled, canReorderSystemFolders]);

    if (!canReorderSystemFolders) {
        const defaultSystemFolders = getDefaultSytemFolders(showMoved, showScheduled);
        return [
            defaultSystemFolders
                .map((folder) => ({ ...folder, payloadExtras: { Color: ACCENT_COLORS[0], Name: folder.ID } }))
                .filter((folder) => folder.visible === true),
            () => {},
            false,
        ];
    }

    return [visibleSystemFolders, moveItem, loading];
};

export default useMoveSystemFolders;
