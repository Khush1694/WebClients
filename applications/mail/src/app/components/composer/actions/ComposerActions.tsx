import { MESSAGE_FLAGS } from '@proton/shared/lib/mail/constants';
import { hasFlag } from '@proton/shared/lib/mail/messages';
import { MutableRefObject, useRef } from 'react';
import { c } from 'ttag';
import { isToday, isYesterday } from 'date-fns';
import {
    Button,
    classnames,
    Tooltip,
    Icon,
    EllipsisLoader,
    useMailSettings,
    FeatureCode,
    useUser,
    Spotlight,
    Href,
    useSpotlightOnFeature,
    useFeatures,
    useSpotlightShow,
} from '@proton/components';
import { metaKey, shiftKey, altKey } from '@proton/shared/lib/helpers/browser';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import { formatSimpleDate } from '../../../helpers/date';
import AttachmentsButton from '../../attachment/AttachmentsButton';
import SendActions from '../SendActions';
import { getAttachmentCounts } from '../../../helpers/message/messages';
import { MessageChange, MessageChangeFlag } from '../Composer';
import { MessageState } from '../../../logic/messages/messagesTypes';
import ComposerPasswordActions from './ComposerPasswordActions';
import ComposerMoreActions from './ComposerMoreActions';

interface Props {
    className?: string;
    message: MessageState;
    date: Date;
    lock: boolean;
    opening: boolean;
    syncInProgress: boolean;
    onAddAttachments: (files: File[]) => void;
    onPassword: () => void;
    onExpiration: () => void;
    onScheduleSendModal: () => void;
    onSend: () => Promise<void>;
    onDelete: () => void;
    addressesBlurRef: MutableRefObject<() => void>;
    attachmentTriggerRef: MutableRefObject<() => void>;
    loadingScheduleCount: boolean;
    onChangeFlag: MessageChangeFlag;
    onChange: MessageChange;
}

const ComposerActions = ({
    className,
    message,
    date,
    lock,
    opening,
    syncInProgress,
    onAddAttachments,
    onPassword,
    onExpiration,
    onScheduleSendModal,
    onSend,
    onDelete,
    addressesBlurRef,
    attachmentTriggerRef,
    loadingScheduleCount,
    onChangeFlag,
    onChange,
}: Props) => {
    const [
        { feature: scheduleSendFeature, loading: loadingScheduleSendFeature },
        { feature: numAttachmentsWithoutEmbeddedFeature },
    ] = useFeatures([FeatureCode.ScheduledSend, FeatureCode.NumAttachmentsWithoutEmbedded]);

    const { pureAttachmentsCount, attachmentsCount } = message.data?.Attachments
        ? getAttachmentCounts(message.data?.Attachments, message.messageImages)
        : { pureAttachmentsCount: 0, attachmentsCount: 0 };

    const isAttachments = numAttachmentsWithoutEmbeddedFeature?.Value ? pureAttachmentsCount > 0 : attachmentsCount > 0;
    const isPassword = hasFlag(MESSAGE_FLAGS.FLAG_INTERNAL)(message.data) && !!message.data?.Password;
    const isExpiration = !!message.draftFlags?.expiresIn;
    const sendDisabled = lock;
    const [{ Shortcuts = 0 } = {}] = useMailSettings();
    const [{ hasPaidMail }] = useUser();

    let dateMessage: string | string[];
    if (opening) {
        const ellipsis = <EllipsisLoader key="ellipsis1" />;
        dateMessage = c('Action').jt`Loading${ellipsis}`;
    } else if (syncInProgress) {
        const ellipsis = <EllipsisLoader key="ellipsis2" />;
        dateMessage = c('Action').jt`Saving${ellipsis}`;
    } else if (date.getTime() !== 0) {
        const dateString = formatSimpleDate(date);
        if (isToday(date)) {
            dateMessage = c('Info').t`Saved at ${dateString}`;
        } else if (isYesterday(date)) {
            dateMessage = c('Info').t`Saved ${dateString}`;
        } else {
            dateMessage = c('Info').t`Saved on ${dateString}`;
        }
    } else {
        dateMessage = c('Action').t`Not saved`;
    }

    const titleAttachment = Shortcuts ? (
        <>
            {c('Title').t`Attachments`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">{shiftKey}</kbd> +{' '}
            <kbd className="border-none">A</kbd>
        </>
    ) : (
        c('Title').t`Attachments`
    );

    const titleDeleteDraft = Shortcuts ? (
        <>
            {c('Title').t`Delete draft`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">{altKey}</kbd> +{' '}
            <kbd className="border-none">Backspace</kbd>
        </>
    ) : (
        c('Title').t`Delete draft`
    );
    const titleSendButton = Shortcuts ? (
        <>
            {c('Title').t`Send email`}
            <br />
            <kbd className="border-none">{metaKey}</kbd> + <kbd className="border-none">Enter</kbd>
        </>
    ) : null;

    const hasScheduleSendAccess = !loadingScheduleSendFeature && scheduleSendFeature?.Value && hasPaidMail;

    const dropdownRef = useRef(null);
    const {
        show: showSpotlight,
        onDisplayed,
        onClose: onCloseSpotlight,
    } = useSpotlightOnFeature(FeatureCode.SpotlightScheduledSend, !opening && hasScheduleSendAccess);

    const handleScheduleSend = () => {
        onCloseSpotlight();
        onScheduleSendModal();
    };

    const shouldShowSpotlight = useSpotlightShow(showSpotlight);

    return (
        <footer
            data-testid="composer:footer"
            className={classnames(['composer-actions flex-item-noshrink flex max-w100', className])}
            onClick={addressesBlurRef.current}
        >
            <div className="flex flex-row-reverse flex-align-self-center w100 ml0-5 mr1-5 pl1-25 pr0-25 mb1">
                <Spotlight
                    originalPlacement="top-right"
                    show={shouldShowSpotlight}
                    onDisplayed={onDisplayed}
                    anchorRef={dropdownRef}
                    content={
                        <>
                            {c('Spotlight').t`You can now schedule your messages to be sent later`}
                            <br />
                            <Href url={getKnowledgeBaseUrl('/scheduled-send')} title="Scheduled send">
                                {c('Info').t`Learn more`}
                            </Href>
                        </>
                    }
                >
                    <SendActions
                        disabled={loadingScheduleSendFeature || loadingScheduleCount}
                        loading={loadingScheduleSendFeature || loadingScheduleCount}
                        shape="solid"
                        color="norm"
                        mainAction={
                            <Tooltip title={titleSendButton}>
                                <Button
                                    loading={loadingScheduleSendFeature}
                                    onClick={onSend}
                                    disabled={sendDisabled}
                                    className="composer-send-button"
                                    data-testid="composer:send-button"
                                >
                                    <Icon name="paper-plane" className="no-desktop no-tablet on-mobile-flex" />
                                    <span className="pl1 pr1 no-mobile">{c('Action').t`Send`}</span>
                                </Button>
                            </Tooltip>
                        }
                        secondAction={
                            hasScheduleSendAccess ? (
                                <Tooltip>
                                    <DropdownMenuButton
                                        className="text-left flex flex-align-items-center"
                                        onClick={handleScheduleSend}
                                        data-testid="composer:schedule-send-button"
                                    >
                                        <Icon name="clock" className="flex-item-noshrink" />
                                        <span className="pl0-5 pr0-5 flex-item-fluid">{c('Action')
                                            .t`Schedule send`}</span>
                                    </DropdownMenuButton>
                                </Tooltip>
                            ) : undefined
                        }
                        dropdownRef={dropdownRef}
                    />
                </Spotlight>

                <div className="flex flex-item-fluid">
                    <div className="flex">
                        <Tooltip title={titleDeleteDraft}>
                            <Button
                                icon
                                disabled={lock}
                                onClick={onDelete}
                                shape="ghost"
                                className="mr0-5"
                                data-testid="composer:delete-draft-button"
                            >
                                <Icon name="trash" alt={c('Action').t`Delete draft`} />
                            </Button>
                        </Tooltip>
                        <ComposerPasswordActions isPassword={isPassword} onChange={onChange} onPassword={onPassword} />
                        <ComposerMoreActions
                            isExpiration={isExpiration}
                            message={message}
                            onExpiration={onExpiration}
                            onChangeFlag={onChangeFlag}
                            lock={lock}
                            onChange={onChange}
                        />
                    </div>
                    <div className="flex-item-fluid flex pr1">
                        <span className="mr0-5 mauto no-mobile color-weak">{dateMessage}</span>
                        <Tooltip title={titleAttachment}>
                            <AttachmentsButton
                                isAttachments={isAttachments}
                                disabled={lock}
                                onAddAttachments={onAddAttachments}
                                attachmentTriggerRef={attachmentTriggerRef}
                                data-testid="composer:attachment-button"
                            />
                        </Tooltip>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default ComposerActions;