class AsyncQueue {
    private queue: any[];
    private resolvers: any[];
    private enabledBlockIfEmpty: boolean = false;
    
    constructor() {
        this.queue = [];
        this.resolvers = [];
    }

    enqueue(item:any) {
        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift();
            resolve(item);
        }
        else {
            this.queue.push(item);
        }
    }

    async dequeue() {
        if (this.queue.length > 0) {
            return this.queue.shift();
        }
        else if (this.enabledBlockIfEmpty) {
            return new Promise(resolve => {
                this.resolvers.push(resolve);
            });
        }
        else {
            return null;
        }
    }

    enableBlockIfEmpty(enabled:boolean) {
        this.enabledBlockIfEmpty = enabled;
        
        if (!this.enabledBlockIfEmpty) {
            while (this.resolvers.length > 0) {
                const resolve = this.resolvers.shift();
                resolve(null);
            }
        }
    }
}

export default AsyncQueue;