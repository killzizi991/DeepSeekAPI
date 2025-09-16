class GitHubAPI {
    constructor() {
        this.repoTree = document.getElementById('repo-tree');
        this.branchSelector = document.getElementById('branch-selector');
        this.branchSelect = document.getElementById('branch');
        this.setupEventListeners();
    }

    setupEventListeners() {
        document.getElementById('load-repo').addEventListener('click', () => this.loadRepository());
    }

    async loadRepository() {
        const repoUrl = document.getElementById('repo-url').value;
        if (!repoUrl) return;

        try {
            const repoInfo = this.parseGitHubUrl(repoUrl);
            if (!repoInfo) throw new Error('Invalid GitHub URL');

            const branches = await this.fetchBranches(repoInfo.owner, repoInfo.repo);
            this.populateBranchSelector(branches);

            const defaultBranch = branches.find(b => b.name === repoInfo.branch) || branches[0];
            await this.loadBranch(repoInfo.owner, repoInfo.repo, defaultBranch.name);
        } catch (error) {
            alert('Ошибка загрузки репозитория: ' + error.message);
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

        this.branchSelect.addEventListener('change', () => {
            const repoUrl = document.getElementById('repo-url').value;
            const repoInfo = this.parseGitHubUrl(repoUrl);
            this.loadBranch(repoInfo.owner, repoInfo.repo, this.branchSelect.value);
        });
    }

    async loadBranch(owner, repo, branch) {
        const response = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`);
        if (!response.ok) throw new Error('Failed to load branch');
        const tree = await response.json();
        this.displayRepoTree(tree.tree);
    }

    displayRepoTree(tree) {
        this.repoTree.innerHTML = '';
        tree.forEach(item => {
            if (item.type !== 'blob') return;

            const div = document.createElement('div');
            div.className = 'file-item';
            
            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.checked = true;

            const label = document.createElement('label');
            label.textContent = item.path;

            div.appendChild(checkbox);
            div.appendChild(label);
            this.repoTree.appendChild(div);
        });
    }

    getSelectedFiles() {
        const selected = [];
        this.repoTree.querySelectorAll('.file-item').forEach(item => {
            const checkbox = item.querySelector('input[type="checkbox"]');
            if (checkbox.checked) {
                selected.push(item.querySelector('label').textContent);
            }
        });
        return selected;
    }
}
