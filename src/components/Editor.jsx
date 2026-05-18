import CodeMirror from '@uiw/react-codemirror';
import { javascript } from '@codemirror/lang-javascript';
import { oneDark } from '@codemirror/theme-one-dark';
import { EditorView } from '@codemirror/view';

const fullHeightTheme = EditorView.theme({
  '&': { height: '100%' },
  '.cm-scroller': { overflow: 'auto' },
  '.cm-content': { minHeight: '100%' },
});

export default function Editor({ code, onChange, isPlaying, onCreateEditor }) {
  return (
    <div
      className={isPlaying ? 'editor-playing' : undefined}
      style={{ flex: 1, minWidth: 0, overflow: 'hidden', height: '100%' }}
    >
      <CodeMirror
        value={code}
        onChange={onChange}
        onCreateEditor={onCreateEditor}
        extensions={[javascript(), fullHeightTheme]}
        theme={oneDark}
        height="100%"
        style={{ height: '100%', fontSize: '14px' }}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          foldGutter: false,
          dropCursor: false,
          allowMultipleSelections: false,
          indentOnInput: true,
          bracketMatching: true,
          closeBrackets: true,
          autocompletion: false,
          rectangularSelection: false,
          crosshairCursor: false,
          highlightActiveLine: true,
          highlightSelectionMatches: false,
          closeBracketsKeymap: true,
          defaultKeymap: true,
          searchKeymap: false,
          historyKeymap: true,
          foldKeymap: false,
          completionKeymap: false,
          lintKeymap: false,
        }}
      />
    </div>
  );
}
