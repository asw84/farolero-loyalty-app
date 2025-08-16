// backend/modules/container.js
// Dependency Injection Container для модульной архитектуры

class Container {
    constructor() {
        this.services = new Map();
        this.instances = new Map();
        this.factories = new Map();
    }

    /**
     * Регистрация сервиса как singleton
     * @param {string} name - имя сервиса
     * @param {Function} factory - фабрика для создания сервиса
     */
    register(name, factory) {
        this.factories.set(name, factory);
        return this;
    }

    /**
     * Регистрация существующего экземпляра
     * @param {string} name - имя сервиса
     * @param {*} instance - готовый экземпляр
     */
    registerInstance(name, instance) {
        this.instances.set(name, instance);
        return this;
    }

    /**
     * Получение сервиса (singleton pattern)
     * @param {string} name - имя сервиса
     * @returns {*} экземпляр сервиса
     */
    resolve(name) {
        // Если экземпляр уже создан, возвращаем его
        if (this.instances.has(name)) {
            return this.instances.get(name);
        }

        // Если есть фабрика, создаем экземпляр
        if (this.factories.has(name)) {
            const factory = this.factories.get(name);
            const instance = factory(this);
            this.instances.set(name, instance);
            return instance;
        }

        throw new Error(`Service '${name}' not found in container`);
    }

    /**
     * Проверка существования сервиса
     * @param {string} name - имя сервиса
     * @returns {boolean}
     */
    has(name) {
        return this.factories.has(name) || this.instances.has(name);
    }

    /**
     * Получение всех зарегистрированных сервисов
     * @returns {Array<string>}
     */
    getRegisteredServices() {
        const factoryNames = Array.from(this.factories.keys());
        const instanceNames = Array.from(this.instances.keys());
        return [...new Set([...factoryNames, ...instanceNames])];
    }

    /**
     * Очистка контейнера (для тестов)
     */
    clear() {
        this.services.clear();
        this.instances.clear();
        this.factories.clear();
    }

    /**
     * Создание child container с унаследованными сервисами
     * @returns {Container}
     */
    createChild() {
        const child = new Container();
        // Копируем фабрики, но не экземпляры (child будет создавать свои)
        child.factories = new Map(this.factories);
        return child;
    }
}

// Глобальный контейнер приложения
const container = new Container();

module.exports = { Container, container };
