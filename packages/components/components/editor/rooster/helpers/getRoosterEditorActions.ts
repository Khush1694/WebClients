import { IEditor, Direction } from 'roosterjs-editor-types';
import { EditorActions } from '../../interface';

/**
 * @param editorInstance
 * @returns set of external actions
 */
const getRoosterEditorActions = (
    editorInstance: IEditor,
    clearUndoHistory: () => void,
    setTextDirection: (direction: Direction) => void
): EditorActions => {
    return {
        getContent() {
            return editorInstance.getContent();
        },
        isDisposed() {
            return editorInstance.isDisposed();
        },
        setContent(value: string) {
            editorInstance.setContent(value);
        },
        focus() {
            editorInstance.focus();
        },
        insertImage(url: string, attrs: { [key: string]: string } = {}) {
            const imageNode = document.createElement('img');

            Object.entries(attrs).forEach(([key, value]) => {
                imageNode.setAttribute(key, value);
            });

            imageNode.src = url;
            imageNode.classList.add('proton-embedded');
            editorInstance.insertNode(imageNode);
        },
        clearUndoHistory,
        setTextDirection,
    };
};

export default getRoosterEditorActions;
