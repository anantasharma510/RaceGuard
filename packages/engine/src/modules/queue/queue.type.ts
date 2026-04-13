export interface QueueTask<T = any>{
    execute:()=>Promise<T>;
}

export interface QueueProgress {
    completed:number;
    failed:number;
    total:number;
}

export type ProgressCallback = (progress:QueueProgress)=> void;