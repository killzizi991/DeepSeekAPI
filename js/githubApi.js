class GitHubAPI {
    constructor() {
        this.repoTree = document.getElementById('repo-tree');
        this.branchSelector = document.getElementById('branch-selector');
        this.branchSelect = document.getElementById('branch');
        this.selectedFiles = new Map();
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('load-repo').addEventListener('click', () => this.loadRepository());
        this.branchSelect.addEventListener('change', () => this.onBranchChange());
    }

    async loadRepository() {
        const repoUrl = document.getElementById('repo-url').value;
        if (!repoUrl) return;

        this.showLoader();
        try {
            const repoInfo = this.parseGitHubUrl(repoUrl);
            if (!repoInfo) throw new Error('Invalid GitHub URL');

            const branches = await this.fetchBranches(repoInfo.owner, repoInfo.repo);
            this.populateBranchSelector(branches);

            const defaultBranch = branches.find(b => b.name === repoInfo.branch) || branches[0];
            await this.loadBranch(repoInfo.owner, repoInfo.repo, defaultBranch.name);
        } catch (error) {
            alert('Ошибка загрузки репозитория: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    parseGitHubUrl(url) {
        const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)(\/tree\/([^\/]+))?/);
        if (!match) return null;

        return {
            owner: match[1],
            repo: match[2],
            branch: match[4] || 'main'
        };
    }

    async fetchBranches(owner, repo) {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/branches`);
        if (!response.ok) throw new Error('Repository not found');
        return await response.json();
    }

    populateBranchSelector(branches) {
        this.branchSelector.classList.remove('hidden');
        this.branchSelect.innerHTML = '';
        branches.forEach(branch => {
            const option = document.createElement('option');
            option.value = branch.name;
            option.textContent = branch.name;
            this.branchSelect.appendChild(option);
        });
    }

    async onBranchChange() {
        const repoUrl = document.getElementById('repo-url').value;
        const repoInfo = this.parseGitHubUrl(repoUrl);
        this.showLoader();
        try {
            await this.loadBranch(repoInfo.owner, repoInfo.repo, this.branchSelect.value);
        } catch (error) {
            alert('Ошибка загрузки ветки: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }

    async loadBranch(owner, repo, branch) {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
        if (!response.ok) throw new Error('Failed to load branch');
        const tree = await response.json();
        this.displayRepoTree(tree.tree, owner, repo, branch);
    }

    async displayRepoTree(tree, owner, repo, branch) {
        this.repoTree.innerHTML = '';
        this.selectedFiles.clear();
        
        for (const item of tree) {
            if (item.type !== 'blob') continue;

            const div = document.createElement('div');
            div.className = 'file-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;
            checkbox.addEventListener('change', (e) => this.onFileSelect(e.target, item.path, owner, repo, branch));

            const label = document.createElement('label');
            label.textContent = item.path;

            div.appendChild(checkbox);
            div.appendChild(label);
            this.repoTree.appendChild(div);

            // Загружаем содержимое файла
            if (checkbox.checked) {
                await this.loadFileContent(item.path, owner, repo, branch);
            }
        }
    }

    async onFileSelect(checkbox, path, owner, repo, branch) {
        if (checkbox.checked) {
            await this.loadFileContent(path, owner, repo, branch);
        } else {
            this.selectedFiles.delete(path);
        }
    }

    async loadFileContent(path, owner, repo, branch) {
        this.showLoader();
        try {
            const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${branch}`);
            if (!response.ok) throw new Error('Failed to load file content');
            
            const fileData = await response.json();
            const content = atob(fileData.content); // Декодируем base64
            this.selectedFiles.set(path, content);
        } catch (error) {
            console.error('Error loading file content:', error);
            alert(`Ошибка загрузки файла ${path}: ${error.message}`);
        } finally {
            this.hideLoader();
        }
    }

    getSelectedFiles() {
        let formatted = '';
        let totalSize = 0;
        
        this.selectedFiles.forEach((content, path) => {
            totalSize += content.length;
            formatted += `[file name]: ${path}\n[file content begin]\n${content}\n[file content end]\n\n`;
        });

        if (totalSize > 5 * 1024 * 1024) {
            if (!confirm(`Общий размер данных ${this.formatFileSize(totalSize)} превышает 5 МБ. Продолжить?`)) {
                throw new Error('Размер данных превышает лимит');
            }
        }

        return formatted;
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    showLoader() {
        document.getElementById('github-loader').classList.remove('hidden');
    }

    hideLoader() {
        document.getElementById('github-loader').classList.add('hidden');
    }
}
