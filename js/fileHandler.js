class FileHandler {
    constructor() {
        this.fileTree = document.getElementById('file-tree');
        this.selectedFiles = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('select-files').addEventListener('click', () => this.selectFiles());
        document.getElementById('select-folder').addEventListener('click', () => this.selectFolder());
        document.getElementById('clear-files').addEventListener('click', () => this.clearFiles());
        document.getElementById('file-filter').addEventListener('input', (e) => this.filterFiles(e.target.value));
        
        const dropZone = document.getElementById('drop-zone');
        dropZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            dropZone.classList.add('active');
        });
        
        dropZone.addEventListener('dragleave', () => {
            dropZone.classList.remove('active');
        });
        
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            dropZone.classList.remove('active');
            this.handleDrop(e.dataTransfer.items);
        });
    }

    async selectFiles() {
        const fileHandles = await window.showOpenFilePicker({
            multiple: true,
            types: [{
                description: 'All Files',
                accept: {'*/*': ['.*']}
            }]
        });
        
        for (const fileHandle of fileHandles) {
            await this.addFile(fileHandle);
        }
        this.updateFileTree();
    }

    async selectFolder() {
        const dirHandle = await window.showDirectoryPicker();
        await this.processDirectory(dirHandle);
        this.updateFileTree();
    }

    async processDirectory(dirHandle, path = '') {
        for await (const entry of dirHandle.values()) {
            const fullPath = path ? `${path}/${entry.name}` : entry.name;
            
            if (entry.kind === 'file') {
                await this.addFile(entry, fullPath);
            } else if (entry.kind === 'directory') {
                if (!this.shouldIgnoreDirectory(entry.name)) {
                    await this.processDirectory(entry, fullPath);
                }
            }
        }
    }

    shouldIgnoreDirectory(name) {
        const ignoredDirs = ['node_modules', '.git', 'venv', '__pycache__', '.idea', '.vscode'];
        return ignoredDirs.includes(name);
    }

    async addFile(fileHandle, path = null) {
        try {
            const file = await fileHandle.getFile();
            const filePath = path || file.name;
            
            if (this.isValidFile(filePath)) {
                this.selectedFiles.set(filePath, {
                    handle: fileHandle,
                    content: await file.text()
                });
            }
        } catch (error) {
            console.error('Error reading file:', error);
        }
    }

    isValidFile(filePath) {
        const filter = document.getElementById('file-filter').value;
        if (!filter) return true;
        
        const extensions = filter.split(',').map(ext => ext.trim());
        return extensions.some(ext => filePath.endsWith(ext));
    }

    async handleDrop(items) {
        for (const item of items) {
            if (item.kind === 'file') {
                const entry = item.getAsFileSystemHandle ? await item.getAsFileSystemHandle() : null;
                if (entry) {
                    if (entry.kind === 'file') {
                        await this.addFile(entry);
                    } else if (entry.kind === 'directory') {
                        await this.processDirectory(entry);
                    }
                }
            }
        }
        this.updateFileTree();
    }

    updateFileTree() {
        this.fileTree.innerHTML = '';
        this.selectedFiles.forEach((file, path) => {
            const div = document.createElement('div');
            div.className = 'file-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.addEventListener('change', (e) => {
                if (!e.target.checked) {
                    this.selectedFiles.delete(path);
                    this.updateFileTree();
                }
            });

            const label = document.createElement('label');
            label.textContent = path;

            div.appendChild(checkbox);
            div.appendChild(label);
            this.fileTree.appendChild(div);
        });
    }

    filterFiles(filter) {
        this.updateFileTree();
    }

    clearFiles() {
        this.selectedFiles.clear();
        this.fileTree.innerHTML = '';
    }

    async getFormattedFiles() {
        let formatted = '';
        for (const [path, file] of this.selectedFiles) {
            formatted += `[file name]: ${path}\n[file content begin]\n${file.content}\n[file content end]\n\n`;
        }
        return formatted;
    }
}
