import { useRouteMatch } from 'react-router-dom';

import { c } from 'ttag';

import { FloatingButton, Icon, SidebarPrimaryButton, classnames } from '@proton/components';

import useActiveShare from '../../../hooks/drive/useActiveShare';
import { useDownload, useFileUploadInput, useUpload } from '../../../store';

export const UploadButton = ({
    className,
    children = c('Action').t`New upload`,
}: {
    className?: string;
    children?: React.ReactNode;
}) => {
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <SidebarPrimaryButton className={className} onClick={handleClick}>
                {children}
            </SidebarPrimaryButton>
        </>
    );
};

const UploadMobileButton = () => {
    const match = useRouteMatch();
    const { activeFolder } = useActiveShare();
    const {
        inputRef: fileInput,
        handleClick,
        handleChange: handleFileChange,
    } = useFileUploadInput(activeFolder.shareId, activeFolder.linkId);

    const { downloads } = useDownload();
    const { hasUploads } = useUpload();
    const isTransferring = hasUploads || downloads.length > 0;

    if (match.url === '/devices') {
        return null;
    }

    return (
        <>
            <input multiple type="file" ref={fileInput} className="hidden" onChange={handleFileChange} />
            <FloatingButton
                className={classnames([isTransferring && 'fab--is-higher'])}
                onClick={handleClick}
                title={c('Action').t`New upload`}
            >
                <Icon size={24} name="plus" className="mauto" />
            </FloatingButton>
        </>
    );
};

const UploadSidebarButton = ({ mobileVersion = false }: { mobileVersion?: boolean }) => {
    if (mobileVersion) {
        return <UploadMobileButton />;
    }
    return <UploadButton className="no-mobile" />;
};
export default UploadSidebarButton;
