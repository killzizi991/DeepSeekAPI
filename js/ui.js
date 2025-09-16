class UI {
    constructor() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadHistory();
    }

    setupEventListeners() {
        document.getElementById('save-settings').addEventListener('click', () => this.saveSettings());
        document.getElementById('send-request').addEventListener('click', () => this.sendRequest());
        document.getElementById('copy-code').addEventListener('click', () => this.copyCode());
        document.getElementById('download-code').addEventListener('click', () => this.downloadCode());
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.target));
        });
    }

    loadSettings() {
        document.getElementById('api-key').value = Storage.getApiKey();
        document.getElementById('model').value = Storage.getModel();
        document.getElementById('temperature').value = Storage.getTemperature();
        document.getElementById('max-tokens').value = Storage.getMaxTokens();
    }

    saveSettings() {
        Storage.setApiKey(document.getElementById('api-key').value);
        Storage.setModel(document.getElementById('model').value);
        Storage.setTemperature(document.getElementById('temperature').value);
        Storage.setMaxTokens(document.getElementById('max-tokens').value);
        alert('Настройки сохранены');
    }

    async sendRequest() {
        const apiKey = Storage.getApiKey();
        if (!apiKey) {
            alert('Введите API ключ');
            return;
        }

        const userPrompt = document.getElementById('user-prompt').value;
        if (!userPrompt) {
            alert('Введите запрос');
            return;
        }

        const fileHandler = new FileHandler();
        const filesContent = await fileHandler.getFormattedFiles();
        const systemPrompt = document.getElementById('system-prompt').value;

        const fullPrompt = systemPrompt + '\n\n' + filesContent + '\n\n' + userPrompt;

        try {
            const response = await this.makeApiRequest(fullPrompt);
            this.displayResponse(response);
            Storage.addToHistory(fullPrompt, response);
            this.loadHistory();
        } catch (error) {
            alert('Ошибка запроса: ' + error.message);
        }
    }

    async makeApiRequest(prompt) {
        const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${Storage.getApiKey()}`
            },
            body: JSON.stringify({
                model: Storage.getModel(),
                messages: [{ role: 'user', content: prompt }],
                temperature: Storage.getTemperature(),
                max_tokens: Storage.getMaxTokens()
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        return data.choices[0].message.content;
    }

    displayResponse(response) {
        document.getElementById('response-content').textContent = response;
        document.getElementById('code-content').textContent = this.extractCodeFromResponse(response);
        Prism.highlightAll();
    }

    extractCodeFromResponse(response) {
        const codeBlockRegex = /```[\s\S]*?\n([\s\S]*?)\n```/g;
        let match;
        let code = '';
        while ((match = codeBlockRegex.exec(response)) !== null) {
            code += match[1] + '\n';
        }
        return code.trim();
    }

    copyCode() {
        const code = document.getElementById('code-content').textContent;
        navigator.clipboard.writeText(code).then(() => {
            alert('Код скопирован в буфер обмена');
        });
    }

    downloadCode() {
        const code = document.getElementById('code-content').textContent;
        const blob = new Blob([code], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'deepseek_code.txt';
        a.click();
        URL.revokeObjectURL(url);
    }

    switchTab(button) {
        const tabName = button.dataset.tab;
        document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        button.classList.add('active');
        document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    }

    loadHistory() {
        const history = Storage.getHistory();
        const historyList = document.getElementById('history-list');
        historyList.innerHTML = '';
        history.forEach((item, index) => {
            const li = document.createElement('li');
            li.textContent = `Запрос ${index + 1} - ${new Date(item.timestamp).toLocaleString()}`;
            li.addEventListener('click', () => this.loadHistoryItem(item));
            historyList.appendChild(li);
        });
    }

    loadHistoryItem(item) {
        document.getElementById('response-content').textContent = item.response;
        document.getElementById('code-content').textContent = this.extractCodeFromResponse(item.response);
        Prism.highlightAll();
    }
}
