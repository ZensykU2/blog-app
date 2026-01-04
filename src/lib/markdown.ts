export const insertMarkdown = (
    textarea: HTMLTextAreaElement,
    syntax: string,
    type: 'wrap' | 'block' | 'link' | 'image' = 'wrap'
) => {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const before = text.substring(0, start);
    const selection = text.substring(start, end);
    const after = text.substring(end);

    let newText = text;
    let newCursorPos = end;

    if (type === 'wrap') {
        newText = `${before}${syntax}${selection}${syntax}${after}`;
        newCursorPos = end + syntax.length * 2;
        if (selection.length === 0) {
            newCursorPos = start + syntax.length;
        }
    } else if (type === 'block') {
        // Basic block insertion (adds to start of line or current pos)
        // For simplicity, just inserting at cursor. 
        // Ideally meaningful blocks start on new lines, but users can handle that.
        newText = `${before}${syntax}${selection}${after}`;
        newCursorPos = start + syntax.length;
    } else if (type === 'link') {
        newText = `${before}[${selection || 'Link'}](url)${after}`;
        newCursorPos = start + (selection || 'Link').length + 3; // Position inside (url) part approximately
    } else {
        newText = `${before}${syntax}${after}`;
        newCursorPos = start + syntax.length;
    }

    // Handle specific case for HTML underline if passed manually as wrap
    if (syntax === "<u>|</u>") {
        const [open, close] = ["<u>", "</u>"];
        newText = `${before}${open}${selection}${close}${after}`;
        newCursorPos = end + open.length + close.length;
        if (selection.length === 0) {
            newCursorPos = start + open.length;
        }
    }

    // Update textarea value and notify React (hacky but standard for controlled inputs via ref)
    // Actually, better to return the new string and let component update state.
    return { newText, newCursorPos };
};
