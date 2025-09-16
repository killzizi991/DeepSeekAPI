class Storage {
    static getApiKey() {
        return localStorage.getItem('apiKey') || '';
    }

    static setApiKey(apiKey) {
        localStorage.setItem('apiKey', apiKey);
    }

    static getModel() {
        return localStorage.getItem('model') || 'deepseek-chat';
    }

    static setModel(model) {
        localStorage.setItem('model', model);
    }

    static getTemperature() {
        return parseFloat(localStorage.getItem('temperature')) || 0.7;
    }

    static setTemperature(temperature) {
        localStorage.setItem('temperature', temperature.toString());
    }

    static getMaxTokens() {
        return parseInt(localStorage.getItem('maxTokens')) || 2048;
    }

    static setMaxTokens(maxTokens) {
        localStorage.setItem('maxTokens', maxTokens.toString());
    }

    static getHistory() {
        return JSON.parse(localStorage.getItem('history') || '[]');
    }

    static addToHistory(request, response) {
        const history = this.getHistory();
        history.push({ request, response, timestamp: new Date().toISOString() });
        localStorage.setItem('history', JSON.stringify(history));
    }

    static clearHistory() {
        localStorage.removeItem('history');
    }

    static getTheme() {
        return localStorage.getItem('theme') || 'light';
    }

    static setTheme(theme) {
        localStorage.setItem('theme', theme);
    }

    static getLanguage() {
        return localStorage.getItem('language') || 'ru';
    }

    static setLanguage(language) {
        localStorage.setItem('language', language);
    }
}
