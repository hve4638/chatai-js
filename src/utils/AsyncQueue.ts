/**
 * 비동기 큐
 */
class AsyncQueue<T> {
    private queue: T[];
    private resolvers:((value: T|null) => void)[];
    private enabledBlockIfEmpty: boolean = true;
    
    constructor() {
        this.queue = [];
        this.resolvers = [];
    }

    producer() {
        return new AsyncQueueProducer(this);
    }
    consumer() {
        return new AsyncQueueConsumer(this);
    }

    /**
     * 아이템 추가
     */
    enqueue(item:T) {
        if (this.resolvers.length > 0) {
            const resolve = this.resolvers.shift()!;
            resolve(item);
        }
        else {
            this.queue.push(item);
        }
    }

    /**
     * 아이템 가져오기
     * 
     * blockIfEmpty가 true일 경우, 아이템이 없을 경우 아이템을 가져올 때까지 대기
     * 
     * blockIfEmpty가 false일 경우, 아이템이 없을 경우 null 반환
     */
    async dequeue():Promise<T|null> {
        if (this.queue.length > 0) {
            return this.queue.shift()!;
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

    /**
     * queue가 비었을 때 dequeue 호출 시 행동 설정
     * 
     * 활성화 시, block 상태가 되어 아이템이 추가될 때까지 대기
     * 비활성화 시, null 반환
     * 
     * 대기 상태에서 비활성화 시, 대기 중인 모든 dequeue 호출에 null 반환
     */
    enableBlockIfEmpty(enabled:boolean) {
        this.enabledBlockIfEmpty = enabled;
        
        if (!this.enabledBlockIfEmpty) {
            while (this.resolvers.length > 0) {
                const resolve = this.resolvers.shift()!;
                resolve(null);
            }
        }
    }
}

class AsyncQueueProducer<T> {
    constructor(private queue:AsyncQueue<T>) {}

    async enqueue(item:T) {
        this.queue.enqueue(item);
    }

    enableBlockIfEmpty(enabled:boolean) {
        this.queue.enableBlockIfEmpty(enabled);
    }
}


class AsyncQueueConsumer<T> {
    constructor(private queue:AsyncQueue<T>) {}

    async dequeue():Promise<T|null> {
        return this.queue.dequeue();
    }
}

export type {
    AsyncQueueProducer,
    AsyncQueueConsumer,
}
export default AsyncQueue;