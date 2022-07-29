import { forwardRef, memo, ReactNode, Ref } from 'react';
import { Redirect, useRouteMatch } from 'react-router-dom';
import {
    useMailSettings,
    useLabels,
    useFolders,
    useWelcomeFlags,
    LocationErrorBoundary,
    MailShortcutsModal,
    useModalState,
} from '@proton/components';
import { Label } from '@proton/shared/lib/interfaces/Label';
import { MailSettings } from '@proton/shared/lib/interfaces';
import PrivateLayout from '../components/layout/PrivateLayout';
import MailboxContainer from './mailbox/MailboxContainer';
import { HUMAN_TO_LABEL_IDS } from '../constants';
import { Breakpoints } from '../models/utils';
import { useDeepMemo } from '../hooks/useDeepMemo';
import { MailUrlParams } from '../helpers/mailboxUrl';
import { useContactsListener } from '../hooks/contact/useContactsListener';
import { usePageHotkeys } from '../hooks/mailbox/usePageHotkeys';
import { useConversationsEvent } from '../hooks/events/useConversationsEvents';
import { useMessagesEvents } from '../hooks/events/useMessagesEvents';
import MailStartupModals from './MailStartupModals';

interface Props {
    params: MailUrlParams;
    breakpoints: Breakpoints;
    isComposerOpened: boolean;
    rightSidebarContent?: ReactNode;
}

const PageContainer = (
    { params: { elementID, labelID, messageID }, breakpoints, isComposerOpened, rightSidebarContent }: Props,
    ref: Ref<HTMLDivElement>
) => {
    const [mailSettings] = useMailSettings();
    const [welcomeFlags, setWelcomeFlagsDone] = useWelcomeFlags();
    const [mailShortcutsProps, setMailShortcutsModalOpen] = useModalState();

    useContactsListener();
    useConversationsEvent();
    useMessagesEvents();

    usePageHotkeys({ onOpenShortcutsModal: () => setMailShortcutsModalOpen(true) });

    if (!labelID) {
        return <Redirect to="/inbox" />;
    }

    return (
        <PrivateLayout
            ref={ref}
            isBlurred={welcomeFlags.isWelcomeFlow}
            labelID={labelID}
            elementID={elementID}
            breakpoints={breakpoints}
            rightSidebarContent={rightSidebarContent}
        >
            <MailStartupModals
                onboardingOpen={!!welcomeFlags.isWelcomeFlow}
                onOnboardingDone={() => setWelcomeFlagsDone()}
            />
            <LocationErrorBoundary>
                <MailboxContainer
                    labelID={labelID}
                    mailSettings={mailSettings as MailSettings}
                    breakpoints={breakpoints}
                    elementID={elementID}
                    messageID={messageID}
                    isComposerOpened={isComposerOpened}
                />
                <MailShortcutsModal {...mailShortcutsProps} />
            </LocationErrorBoundary>
        </PrivateLayout>
    );
};

const MemoPageContainer = memo(forwardRef(PageContainer));

interface PageParamsParserProps {
    breakpoints: Breakpoints;
    isComposerOpened: boolean;
    rightSidebarContent?: ReactNode;
}

const PageParamsParser = (props: PageParamsParserProps, ref: Ref<HTMLDivElement>) => {
    const [labels = []] = useLabels();
    const [folders = []] = useFolders();
    const match = useRouteMatch<MailUrlParams>();

    const params = useDeepMemo(() => {
        const labelIDs = [...labels, ...folders].map(({ ID }: Label) => ID);
        const { elementID, labelID: currentLabelID = '', messageID } = (match || {}).params || {};
        const labelID = HUMAN_TO_LABEL_IDS[currentLabelID] || (labelIDs.includes(currentLabelID) && currentLabelID);
        return { elementID, labelID, messageID };
    }, [match]);

    return <MemoPageContainer ref={ref} {...props} params={params} />;
};
export default forwardRef(PageParamsParser);
